---
title: "The Local HTTPS Guide You NEED to Know for your homelab"
date: "2026-03-29T04:20:59.000Z"
tags: ["Homelab", "Self-Hosted", "Docker", "Tailscale", "Security"]
excerpt: "Stop exposing raw ports and serve your self-hosted applications over a clean, trusted HTTPS domain in under 20 minutes."
draft: true
image: ""
lastmod: "2024-04-14T18:19:17.169Z"
---

I run Immich on a home server. If you're not familiar, Immich is a self-hosted alternative to Google Photos - open source, fast, and does a surprisingly good job of replacing the real thing.

The problem is that by default, Immich binds to port 2283 on every network interface. So if you're on Tailscale with the server, you'd just go to `server-blr:2283` and you're in. No HTTPS, no clean URL, nothing. It works, but it feels wrong.

There are a few reasons you'd want to fix this. The obvious one is HTTPS - without it, your photos are travelling over plain HTTP on your local network, and browsers will keep flagging it as insecure. The less obvious one is that raw port access is just messy: you're handing out hostnames and port numbers to every device you add, and if you ever want to put any kind of access control in front of Immich, a proper reverse proxy is the right place to do that. A clean URL like `https://immich.server.sparker0i.me` also makes it a lot easier to share access with family members without explaining what a port number is.

I wanted to access it via `https://immich.server.sparker0i.me` and have everything else - direct port access, raw IP - blocked entirely. Here's how I did it.

---

## What I'm Working With

Two separate Docker Compose stacks on the same machine:

- **Nginx Proxy Manager (NPM)** - handles reverse proxying and SSL for all my services
- **Immich** - the photo server, running on port 2283

Both stacks also have Tailscale running on the host, and I have a custom domain `sparker0i.me`.

---

## The Approach

The idea is simple:

1. Stop Immich from binding port 2283 on all interfaces - bind it to localhost only
2. Put both stacks on the same Docker network so NPM can reach Immich internally
3. Create a proxy host in NPM pointing at the Immich container
4. Point the subdomain DNS at my Tailscale IP so it's only reachable on the Tailnet

That's it. NPM talks to Immich over Docker's internal network. Nobody outside the host ever sees port 2283.

---

### Bind Immich to Localhost Only

This is the most important change. In the Immich `docker-compose.yml`, change:

```yaml
ports:
  - '2283:2283'
```

to:

```yaml
ports:
  - '127.0.0.1:2283:2283'
```

The `127.0.0.1` prefix tells Docker to only listen on the loopback interface. Your Tailscale interface, your LAN interface - they won't see this port at all.

Restart after this:

```bash
docker compose down && docker compose up -d
```

---

### Shared Docker Network

Both compose stacks reference a network called `server`, but by default each stack creates its own isolated version of it. They can't see each other.

Create a proper external network once:

```bash
docker network create server
```

Then add this to the bottom of **both** compose files:

```yaml
networks:
  server:
    external: true
```

Now NPM can resolve `immich_server` by container name and reach it at `immich_server:2283` - no host port involved.

---

### Create the Proxy Host in NPM

Open NPM at `http://server-blr:81` → Proxy Hosts → Add Proxy Host.

| Field | Value |
|---|---|
| Domain Names | `immich.server.sparker0i.me` |
| Scheme | `http` |
| Forward Hostname | `immich_server` |
| Forward Port | `2283` |
| Websockets Support | ✓ Enabled |

WebSocket support is not optional here. Immich uses WebSockets for upload progress and real-time sync. If you forget it, uploads will silently fail and you'll spend an hour wondering what's wrong.

On the SSL tab, this is where it gets slightly interesting. Because the domain resolves to a private Tailscale IP, Let's Encrypt can't do an HTTP challenge to verify ownership - your server isn't publicly reachable. So you need to use a **DNS challenge** instead, which proves domain ownership by having Let's Encrypt check for a TXT record in your DNS.

NPM supports DNS challenge via a bunch of providers - Cloudflare, DuckDNS, Route53, Namecheap, and more. The flow is the same regardless of which one you use: NPM creates a temporary `_acme-challenge` TXT record in your DNS, Let's Encrypt verifies it, cert is issued, record is cleaned up. About 30 seconds end to end.

What differs is just how you authenticate with your DNS provider. A couple of examples:

**Cloudflare**

Go to My Profile → API Tokens → Create Token. Use the "Edit zone DNS" template, scope it to just your zone (`sparker0i.me`). In NPM, select Cloudflare as the provider and paste the token.

**DuckDNS**

Your DuckDNS token is on the dashboard page after you log in. In NPM, select DuckDNS and paste it. Note that DuckDNS only works for subdomains of `duckdns.org` - so this applies if your domain is something like `myserver.duckdns.org` rather than a custom domain.

In NPM's SSL tab:

- Request a new SSL certificate
- Check "Use a DNS Challenge"
- Select your provider and paste the relevant token/credential

If you want a wildcard cert that covers all subdomains at once (`*.server.sparker0i.me`), you can request that here too - just use the wildcard as the domain name. Wildcard certs only work with DNS challenges anyway, so you're already set up for it.

---

### Point DNS at the Tailscale IP

Get the server's Tailscale IP:

```bash
tailscale ip -4
# e.g. 100.64.0.5
```

Add an A record with your DNS provider pointing at the Tailscale IP:

| Type | Name | Value |
|---|---|---|
| A | `immich.server` | `100.64.0.5` |

If you're on Cloudflare, make sure the proxy status is set to **DNS only** (grey cloud). Cloudflare can't proxy a Tailscale IP, and leaving it on orange cloud will just break things.

Pointing at the Tailscale IP instead of a public IP means the domain only resolves correctly when you're on your Tailnet. If someone outside somehow finds the subdomain, they get a 100.x address they can't reach.

---

### Harden with ufw (Optional)

Steps 1–4 are enough. But if you ever accidentally revert that port binding, you're exposed again. Worth adding explicit deny rules:

```bash
sudo ufw deny in on tailscale0 to any port 2283
sudo ufw deny in on eth0 to any port 2283
```

Replace `eth0` with your actual LAN interface. One note: Docker can bypass ufw in some configurations by writing directly to iptables. So the localhost binding in Step 1 is the real protection - ufw is just a backup.

---

## Does It Work?

From another device on Tailscale:

```bash
# Should work
curl -I https://immich.server.sparker0i.me

# Should fail
curl -I http://server-blr:2283
curl -I http://100.64.0.5:2283
```

First one returns `HTTP/2 200`. Other two return connection refused.

---

## One More Thing

Tailscale has its own `tailscale serve` command that can proxy local services without needing NPM at all. Totally valid approach, especially if Immich is the only service you're proxying.

I already have NPM running for a bunch of other services, so it made more sense to centralise everything there. If you're starting fresh, `tailscale serve` is worth looking at - it's simpler.

---

## Wrapping Up

Honestly, this took me longer to figure out than it should have. Most guides either tell you to just expose the port and move on, or jump straight into complicated setups with Cloudflare tunnels and external DNS. This sits in the middle - it's a proper setup, but it's also entirely local. Nothing leaves your Tailnet.

The localhost port binding is doing the real work here. Everything else - the shared Docker network, the NPM proxy host, the DNS record - is just building on top of that one change. If you take nothing else from this post, take that: `127.0.0.1:2283:2283` instead of `2283:2283`.

The same pattern works for any Docker service in your homelab - Jellyfin, Paperless-ngx, Vaultwarden, whatever. Change the container name and port, add a proxy host, add a DNS record. Done.