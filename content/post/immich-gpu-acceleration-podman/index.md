---
date: '2026-02-01T05:34:00.000Z'
description: "Thr complete saga of configuring Immich with NVIDIA GPU support using Podman Quadlet, and the rootless container pitfalls nobody warns you about."
image: immich.jpg
slug: immich-gpu-acceleration-podman
tags:
- Immich
- Homelab
categories:
- Homelab
title: "Running Immich with GPU Acceleration on Fedora: A Podman Quadlet Journey"
---

Cloud photo services keep getting more expensive, and there's something unsettling about handing years of memories to companies that might change their terms, get acquired, or simply shut down. We've seen that happen with Google Photos when they offered their service for free for the first few years to make people get used to their product, and then flipped the switch on them to make them. 

[Immich](https://immich.app/) offers a compelling alternative - an open-source photo management platform that rivals Google Photos and iCloud, without the subscription fees or storage limits.

I've been running Fedora on my gaming PC for a while - which has since been repurposed to a homelab while not gaming - and Podman has become my go-to container runtime. It's daemon-free, runs rootless by default, and integrates cleanly with systemd. But adding GPU acceleration to the mix - necessary for Immich's AI features like facial recognition and smart search - turns a straightforward setup into a complex puzzle involving user namespaces, device permissions, SELinux policies, and network configuration.

This guide walks through my complete setup of Immich v2 with full CUDA GPU acceleration using Podman Quadlet. The journey involved navigating several poorly-documented incompatibilities between rootless containers and GPU access. The result is a self-hosted photo solution that actually uses your own hardware.

**System Environment:**
- OS: Fedora Linux with SELinux enforcing
- Container Runtime: Podman 5.x (rootless mode)
- GPU: NVIDIA GeForce RTX 5080
- Driver: NVIDIA 580.119.02, CUDA 13.0
- Immich: v2

## Why Not Docker Compose or Podman Compose?

Before diving into the setup, it's worth explaining why I chose Podman Quadlet over the more familiar Docker Compose or even Podman Compose.

### The Case Against Docker

Docker requires a daemon running as root, which means:
- **Root privileges**: The Docker daemon runs with full root access, and any user in the `docker` group effectively has root on the host (they can mount any directory and modify system files)
- **Daemon dependency**: If the Docker daemon crashes or hangs, all containers stop
- **Background service**: Docker constantly consumes resources even when no containers are running

Podman, by contrast, is daemonless and runs rootless by default. Each container runs under your own user, making it inherently more secure for personal homelab use.

### Podman Compose vs Quadlet

Podman Compose exists as a drop-in replacement for Docker Compose, but it has limitations:

- **External tool**: It's a wrapper around Podman that needs to be installed separately and run manually
- **No systemd integration**: Starting containers on boot requires manual setup with systemd service files
- **Command-driven**: You still run `podman-compose up -d`, which feels like a workaround rather than native integration

### Why Quadlet?

**Quadlet** lets you define containers as systemd unit files (`.container`, `.pod`, `.volume`, etc.) in `~/.config/containers/systemd/`. The benefits are significant:

1. **Native systemd integration**: Containers are managed as systemd services - start, stop, enable, and check status using familiar `systemctl` commands
2. **Automatic startup**: Enable services to start on boot with `systemctl --user enable <service>`
3. **Service dependencies**: Define explicit dependencies (e.g., database must start before server) using systemd's `Requires=` and `After=` directives
4. **Unified management**: All system services - containers or not - are managed the same way. Your Immich service appears alongside other systemd services
5. **Declarative configuration**: No imperative `up/down` commands. The configuration files define the desired state, and systemd maintains it

For a homelab server where I want everything to start automatically after a reboot and recover from failures, Quadlet is the cleaner solution. It's the "Fedora way" of running containers - embracing systemd rather than fighting it.

That said, this approach has trade-offs. The main one you'll see in this guide: Quadlet's rootless pods with user namespace remapping create complications with GPU device access that are easier to work around in Docker. But the security and integration benefits are worth the extra setup effort.

## Initial Setup: Converting Docker Compose to Quadlet

Start by obtaining Immich's docker-compose.yml. You would then need to adapt it for Podman by making the following changes in the compose file:

- Set `DB_HOSTNAME` and `REDIS_HOSTNAME` to `127.0.0.1` for microservice communication within the same pod
- Used absolute paths for volumes. I'm currently using `/mnt/server/immich-app`
- Specified environment file location

```yaml
name: immich

services:
  immich-server:
    image: ghcr.io/immich-app/immich-server:v2
    volumes:
      - /mnt/server/immich-app/server/upload:/data
      - /etc/localtime:/etc/localtime:ro
    ports:
      - "2283:2283"
    depends_on:
      - redis
      - database
    environment:
      DB_HOSTNAME: 127.0.0.1
      REDIS_HOSTNAME: 127.0.0.1
    env_file:
      - /mnt/server/immich-app/.env
    restart: always

  machine-learning:
    image: ghcr.io/immich-app/immich-machine-learning:v2-cuda
    volumes:
      - /mnt/server/immich-app/model-cache:/cache
    env_file:
      - /mnt/server/immich-app/.env
    restart: always

  immich-redis:
    image: docker.io/valkey/valkey:9
    volumes:
      - /mnt/server/immich-app/redis:/data
    restart: always

  immich-database:
    image: ghcr.io/immich-app/postgres:14-vectorchord0.4.3-pgvectors0.2.0
    volumes:
      - /mnt/server/immich-app/postgres:/var/lib/postgresql/data
    env_file:
      - /mnt/server/immich-app/.env
    restart: always
```

### Converting with podlet

Use [podlet](https://github.com/containers/podlet) to convert the compose file to Quadlet unit files:

```bash
# Install podlet if not already installed
dnf install podlet

# Convert to Quadlet files
podlet compose -i -a --pod
```

The `-i` flag adds `[Install]` sections, `-a` converts relative paths to absolute paths, and `--pod` creates a pod for all services.

This generates `.container` and `.pod` files that belong in `~/.config/containers/systemd/`. However, achieving GPU acceleration requires working through several complications that aren't covered in the standard documentation.

## The Journey: Issues Encountered and Solutions

### 1. Database Mount Directory Ownership Issues

**Problem Manifestation:**

The PostgreSQL data directory at `/mnt/server/immich-app/postgres` was owned by `systemd-oom` user from a previous installation attempt, causing permission denied errors when the database tried to access files.

**Solution:**

Changed ownership to the current user:

```bash
sudo chown -R $USER:$USER /mnt/server/immich-app/postgres
```

Then added `UserNS=keep-id` to the pod configuration to maintain consistent UID/GID between host and containers:

```ini
# immich.pod
[Pod]
PodName=systemd-immich
PublishPort=2283:2283
UserNS=keep-id

[Install]
WantedBy=default.target
```

### 2. SELinux Volume Mount Errors

**Problem Manifestation:**

Server container failed to start with SELinux errors when using the `:Z` flag on existing volume mounts.

**Solution:**

Removed the `:Z` flag and added `--security-opt label=disable` to disable SELinux labeling for this container:

```ini
# server.container
[Container]
...
PodmanArgs=--security-opt label=disable
Volume=/mnt/server/immich-app/server/upload:/data
Volume=/etc/localtime:/etc/localtime:ro
```

### 3. Redis Permission Errors After Running

**Problem Manifestation:**

After solving the database ownership issue, the Immich server started crashing repeatedly with:

```
ERROR [Microservices:MetadataService] Unable to initialize reverse geocoding:
ReplyError: MISCONF Valkey is configured to save RDB snapshots, but it's
currently unable to persist to disk.
```

Valkey logs revealed the root cause:

```
Failed opening the temp RDB file temp-1.rdb (in server root dir /data)
for saving: Permission denied
```

**Solution:**

Found in [nite07's Podman guide](https://www.nite07.com/en/posts/podman/): add `User=root` and `Group=root` to the Redis container configuration:

```ini
# immich-redis.container
[Container]
...
User=root
Group=root
...
```

After this change, reload systemd:

```bash
systemctl --user daemon-reload
systemctl --user restart immich-pod
```

### 4. Machine Learning Service Unreachable

**Problem Manifestation:**

Server logs showed ML service became unhealthy, unable to connect to the machine learning container.

**Solution:**

The server was trying to reach the ML service using container hostname. Added explicit environment variable to use localhost:

```ini
# immich-server.container
[Container]
...
Environment=DB_HOSTNAME=127.0.0.1 REDIS_HOSTNAME=127.0.0.1 IMMICH_MACHINE_LEARNING_URL=http://127.0.0.1:3003
...
```

*Note: This was later changed to `http://host.containers.internal:3003` after moving ML outside the pod.*

### 5. The GPU Challenge: CUDA Driver Version Mismatch

**Problem Manifestation:**

The ML container initially used implicit GPU assignment:

```ini
PodmanArgs=--gpus all ...
```

When starting, it failed with:

```
CUDA failure 35: CUDA driver version is insufficient for CUDA runtime version
```

Despite having NVIDIA Driver 580.119.02 and CUDA 13.0 installed on the host, the container couldn't access the GPU properly.

**Root Cause:**

After extensive troubleshooting, I discovered that rootless Podman pods with `UserNS=keep-id` are **incompatible with CDI (Container Device Interface) GPU device access**. This isn't well-documented and required significant debugging to identify.

**Understanding the Conflict:**

**UserNS=keep-id** preserves your host user's UID/GID inside containers. Normally in rootless mode, Podman maps container UIDs to a range of host UIDs (e.g., container root UID 0 → host UID 100000). With `UserNS=keep-id`, your UID stays the same (e.g., UID 1000 stays UID 1000), making file ownership manageable.

**CDI (Container Device Interface)** is NVIDIA's modern approach to exposing GPUs to containers. Instead of manually mounting device nodes like `/dev/nvidia0`, CDI uses a specification file (`nvidia.yaml`) that describes GPU devices, their dependencies, and required hooks. When you use `--device nvidia.com/gpu=all`, Podman reads this spec and sets up the GPU environment.

**The Incompatibility:**

CDI relies on device node ownership and permissions that are set up outside the user namespace. When `UserNS=keep-id` is active in a pod:
1. The pod creates a user namespace with UID mapping
2. CDI tries to bind GPU device nodes into this namespace
3. The device nodes' permissions become inconsistent due to UID remapping
4. The container runtime (crun) fails with "File exists" or permission errors

GPU access works perfectly in standalone containers (no user namespace conflicts) but fails inside pods with `UserNS=keep-id`.

**Solution Path:**

#### Step 1: Set Up CDI (Container Device Interface)

First, make the NVIDIA CDI specification accessible to rootless Podman (Replace `sparker0i` with your username):

```bash
# Copy CDI specification to user directory
mkdir -p ~/.config/cdi
sudo cp /var/run/cdi/nvidia.yaml ~/.config/cdi/
sudo chown sparker0i:sparker0i ~/.config/cdi/nvidia.yaml

# Configure Podman to use CDI
cat > ~/.config/containers/containers.conf << 'EOF'
[engine]
cdi_spec_dirs = ["/var/run/cdi", "/home/sparker0i/.config/cdi"]
EOF
```

Verify CDI devices are available:

```bash
cat /var/run/cdi/nvidia.yaml | head -50
```

#### Step 2: Test CDI GPU Access

Testing confirmed the incompatibility:

```bash
# Test FAILED in pod with UserNS=keep-id
podman run --rm --pod systemd-immich --device nvidia.com/gpu=all \
  ghcr.io/immich-app/immich-machine-learning:v2-cuda echo "Test"
# Error: crun: read status from sync socket: File exists

# Test SUCCEEDED outside pod
podman run --rm --device nvidia.com/gpu=all \
  ghcr.io/immich-app/immich-machine-learning:v2-cuda echo "Test"
# Output: Test
```

This confirmed that CDI GPU devices work perfectly in standalone containers but fail when combined with pod + UserNS=keep-id.

#### Step 3: Move ML Container Outside Pod

The solution was to run the ML container outside the pod with host networking:

```ini
# immich-machine-learning.container
[Container]
EnvironmentFile=/mnt/server/immich-app/.env
Image=ghcr.io/immich-app/immich-machine-learning:v2-cuda
Network=host
Volume=/mnt/server/immich-app/model-cache:/cache
PodmanArgs=--device nvidia.com/gpu=all --security-opt label=disable

[Service]
Restart=always

[Install]
WantedBy=default.target
```

### 6. Network Connectivity Between Pod and Host

**Problem Manifestation:**

After moving the ML container to host network, the server (still in the pod) couldn't reach it at `127.0.0.1:3003`. The containers were now in different network namespaces.

**Solution:**

Podman provides a special hostname `host.containers.internal` that automatically resolves to the host gateway IP from within pod containers. This hostname remains stable across reboots, unlike manually using gateway IPs like `169.254.1.2`.

Testing from inside the server container:

```bash
# Check resolution
podman exec systemd-server getent hosts host.containers.internal
# Output: 169.254.1.2     host.containers.internal host.docker.internal

# Test connectivity
podman exec systemd-server curl -s http://host.containers.internal:3003/ping
# Output: pong
```

Updated the server configuration:

```ini
# server.container
[Container]
Environment=DB_HOSTNAME=127.0.0.1 REDIS_HOSTNAME=127.0.0.1 IMMICH_MACHINE_LEARNING_URL=http://host.containers.internal:3003
...
```

After making this change:

```bash
systemctl --user daemon-reload
systemctl --user restart server.service
```

## Final Working Configuration

After working through all these issues, here's the complete working configuration. All files belong in `~/.config/containers/systemd/`.

### Pod Definition (`immich.pod`)

```ini
[Pod]
PodName=systemd-immich
PublishPort=2283:2283
UserNS=keep-id

[Install]
WantedBy=default.target
```

### Database Container (`immich-database.container`)

```ini
[Unit]
After=immich.pod

[Container]
EnvironmentFile=/mnt/server/immich-app/.env
Image=docker.io/tensorchord/pgvecto-rs:pg14-v0.2.0@sha256:90724186f0a3517cf6914295b5ab410db9ce23190a2d9d0b9dd6463e3fa298f0
Pod=immich.pod
Volume=/mnt/server/immich-app/postgres:/var/lib/postgresql/data

[Service]
Restart=always

[Install]
WantedBy=default.target
```

### Redis Container (`immich-redis.container`)

```ini
[Unit]
After=immich.pod

[Container]
Image=docker.io/valkey/valkey:9
Pod=immich.pod
User=root
Group=root
Volume=/mnt/server/immich-app/redis:/data

[Service]
Restart=always

[Install]
WantedBy=default.target
```

### Server Container (`immich-server.container`)

```ini
[Unit]
Requires=redis.service database.service
After=redis.service database.service

[Container]
Environment=DB_HOSTNAME=127.0.0.1 REDIS_HOSTNAME=127.0.0.1 IMMICH_MACHINE_LEARNING_URL=http://host.containers.internal:3003
EnvironmentFile=/mnt/server/immich-app/.env
Image=ghcr.io/immich-app/immich-server:v2
Pod=immich.pod
PodmanArgs=--security-opt label=disable
Volume=/mnt/server/immich-app/server/upload:/data
Volume=/etc/localtime:/etc/localtime:ro

[Service]
Restart=always

[Install]
WantedBy=default.target
```

### Machine Learning Container (`immich-machine-learning.container`)

```ini
[Container]
EnvironmentFile=/mnt/server/immich-app/.env
Image=ghcr.io/immich-app/immich-machine-learning:v2-cuda
Network=host
Volume=/mnt/server/immich-app/model-cache:/cache
PodmanArgs=--device nvidia.com/gpu=all --security-opt label=disable

[Service]
Restart=always

[Install]
WantedBy=default.target
```

### Deployment Steps

1. **Save unit files**: Place all the above files in `~/.config/containers/systemd/` directory.

2. **Create data directories**:
   ```bash
   mkdir -p /mnt/server/immich-app/{postgres,redis,server/upload,model-cache}
   ```

3. **Reload systemd**:
   ```bash
   systemctl --user daemon-reload
   ```

4. **Start services**:
   ```bash
   # Start the pod first
   systemctl --user start immich.pod

   # Start individual services (they'll auto-start with dependencies)
   systemctl --user start database.service
   systemctl --user start redis.service
   systemctl --user start server.service
   systemctl --user start immich-machine-learning.service
   ```

5. **Enable auto-start on boot** (optional):
   ```bash
   systemctl --user enable immich.pod database.service redis.service \
     server.service immich-machine-learning.service
   ```

6. **Check status**:
   ```bash
   systemctl --user status database.service redis.service \
     server.service immich-machine-learning.service
   ```

## Verification and Testing

### Check All Services are Running

```bash
systemctl --user status database.service redis.service \
  server.service immich-machine-learning.service --no-pager | grep -E "^●|Active:"
```

Expected output showing all services `active (running)`.

### Verify GPU Acceleration is Active

1. **Check ONNX Runtime providers**:
   ```bash
   podman exec systemd-immich-machine-learning python -c \
     "import onnxruntime as ort; print('Available providers:', ort.get_available_providers())"
   ```

   Expected output:
   ```
   Available providers: ['TensorrtExecutionProvider', 'CUDAExecutionProvider', 'CPUExecutionProvider']
   ```

2. **Check GPU memory usage**:
   ```bash
   nvidia-smi --query-compute-apps=pid,process_name,used_memory --format=csv
   ```

   You should see the Python process from the ML container using GPU memory.

3. **Check container logs for CUDA provider**:
   ```bash
   podman logs systemd-immich-machine-learning 2>&1 | grep -i "provider"
   ```

   Expected output:
   ```
   INFO     Setting execution providers to ['CUDAExecutionProvider', 'CPUExecutionProvider']
   ```

### Test Web Interface

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:2283
```

Expected: `200`

Now you can access Immich at `http://localhost:2283` in your browser!

## Key Learnings

1. **CDI vs Device Mounts**: Use CDI (`--device nvidia.com/gpu=all`) instead of explicit device mounts for cleaner GPU access.

2. **UserNS + CDI Incompatibility**: Rootless pods with `UserNS=keep-id` cannot use CDI GPU devices. The workaround is to run GPU containers outside the pod.

3. **Host Networking for GPU**: When GPU containers need to be outside the pod, use `Network=host` for simplicity.

4. **Cross-Network Communication**: Use `host.containers.internal` for pod containers to reach host network services. This hostname is stable across reboots.

5. **SELinux Considerations**: For rootless containers with existing data volumes, use `--security-opt label=disable` instead of `:Z` flag.

6. **Redis Permissions**: Valkey/Redis in rootless containers may need `User=root` and `Group=root` to access data directories.

7. **systemd-reload Required**: Always run `systemctl --user daemon-reload` after editing `.container` files.

8. **CPU Usage is Normal**: ML containers will use significant CPU (20-30%) even with GPU acceleration, as CPU handles preprocessing, data transfer, and orchestration.

## Troubleshooting Commands

```bash
# Check service status
systemctl --user status <service>.service

# View logs
journalctl --user -u <service>.service --since "5 minutes ago"

# Direct container logs
podman logs systemd-<container-name>

# Test network connectivity from container
podman exec <container-name> curl http://host.containers.internal:3003/ping

# Check GPU device mounts
podman inspect <container-name> --format '{{.HostConfig.Devices}}'

# Monitor resource usage
podman stats --no-stream
```

## References

- [Nite07's Podman Guide](https://www.nite07.com/en/posts/podman/) - Redis user/group solution
- [Immich Documentation](https://immich.app/docs)
- [Podman Quadlet Documentation](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html)
- [NVIDIA Container Device Interface](https://github.com/NVIDIA/nvidia-container-toolkit)

## Conclusion

Running Immich with GPU acceleration on Podman requires careful consideration of network namespaces, user namespaces, and device access. The key insight is that GPU containers must run outside pods when using `UserNS=keep-id`, with cross-network communication handled via `host.containers.internal`.

The final setup provides:
- Full GPU acceleration for ML workloads
- Rootless containers for security
- Systemd integration for automatic startup
- Proper service dependencies
- Persistent configuration across reboots
