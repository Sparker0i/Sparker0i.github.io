---
title: "Building a Kubernetes Operator in Go: Automating SaaS Provisioning"
date: "2025-03-15"
tags: ["go", "kubernetes", "platform-engineering"]
excerpt: "How we cut cluster setup time by 75% by writing a custom Kubernetes operator that automated provisioning and patching of our multi-tenant SaaS platform."
draft: false
---

When our team inherited the task of turning an internal IBM framework into a managed SaaS subscription product, the first pain point we hit was provisioning. Every new client required a cluster administrator to manually apply a sequence of YAML manifests, patch config maps, and restart controllers in the right order. For five enterprise clients operating under Sarbanes-Oxley compliance, a single missed step could mean an audit finding.

The fix was a Kubernetes operator — a controller that watches custom resources and drives the cluster toward a desired state. Here's what we built and how it changed operations.

## Why an Operator

Kubernetes controllers aren't magic. They're a reconcile loop: observe current state, compare to desired state, act on the diff. The genius of the operator pattern is that this loop runs continuously, which means it self-heals. A pod that gets manually deleted comes back. A config that someone tweaks by hand gets corrected. For a compliance environment, that idempotence is gold.

The alternative — Helm charts plus a CI pipeline — works but doesn't self-heal. It requires humans to reason about sequencing and state. We wanted zero manual work after a client's tenant resource was created.

## The CRD

We defined a `TenantInstance` custom resource that captures everything needed to provision a client environment:

```go filename="api/v1/tenantinstance_types.go"
package v1

import metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

type TenantInstanceSpec struct {
	ClientID    string `json:"clientId"`
	Tier        string `json:"tier"` // "standard" | "enterprise"
	Region      string `json:"region"`
	StorageSize string `json:"storageSize"`
	SOXEnabled  bool   `json:"soxEnabled"`
}

type TenantInstanceStatus struct {
	Phase   string `json:"phase"` // Pending | Provisioning | Ready | Error
	Message string `json:"message,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
type TenantInstance struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   TenantInstanceSpec   `json:"spec,omitempty"`
	Status TenantInstanceStatus `json:"status,omitempty"`
}
```

The `+kubebuilder` markers generate the CRD YAML and register the status subresource, which lets us update `.status` without triggering an infinite reconcile loop.

## The Reconcile Loop

The controller is built on `controller-runtime`. The reconcile function is called every time the resource changes — or on a periodic requeue:

```go filename="internal/controller/tenantinstance_controller.go"
func (r *TenantInstanceReconciler) Reconcile(
	ctx context.Context,
	req ctrl.Request,
) (ctrl.Result, error) {
	log := log.FromContext(ctx)

	var tenant platformv1.TenantInstance
	if err := r.Get(ctx, req.NamespacedName, &tenant); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	switch tenant.Status.Phase {
	case "":
		return r.handlePending(ctx, &tenant)
	case "Provisioning":
		return r.handleProvisioning(ctx, &tenant)
	case "Ready":
		return r.handleReady(ctx, &tenant, log)
	case "Error":
		return r.handleError(ctx, &tenant)
	}

	return ctrl.Result{RequeueAfter: 10 * time.Minute}, nil
}
```

The `handleReady` function is where ongoing patching happens. It computes a diff between the desired platform version and what's running, then applies a rolling update across the tenant's namespace — no manual work required.

## Handling SOX Compliance

`SOXEnabled: true` triggers an additional reconciliation step: it applies a set of `NetworkPolicy` objects that restrict egress to approved endpoints only, and patches the tenant's `ServiceAccount` with a minimal RBAC role. Both steps are idempotent — applying them twice is safe.

We tested all SOX-specific behaviour using `envtest` from `controller-runtime`, which runs a real API server in-process. Every network policy was covered by a table-driven test before it shipped.

## Results

Before the operator: provisioning a new tenant took two to four hours of engineer time and required a second engineer sign-off for audit purposes. After: creating a `TenantInstance` resource triggers full provisioning in under fifteen minutes with no manual steps. Setup and management time dropped by 75% across our five enterprise clients.

The operator pattern scales well beyond provisioning. We later added reconcilers for quota enforcement, certificate rotation, and config drift correction. The cluster enforces compliance; the team focuses on engineering.
