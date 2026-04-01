---
title: "From JCL to Cloud: Migrating a Mainframe Sales System with Event-Driven Architecture"
date: "2025-01-20"
tags: ["architecture", "cloud", "event-driven", "migration"]
excerpt: "How we replaced a four-day mainframe batch job with a parallel event-driven pipeline that completes in under ten hours — and what we learned about migrating JCL at enterprise scale."
draft: false
---

The IBM sales budget distribution system ran on a mainframe. It had run on a mainframe for decades. Every quarter, it processed the global sales budget through a chain of JCL (Job Control Language) jobs — sequential batch processing that took up to four days to complete. Finance teams worldwide waited for it. If it failed mid-run, the recovery procedure was manual and painful.

When we were tasked with moving it to cloud, the instinct was to lift-and-shift: translate the JCL into equivalent shell scripts or Spark jobs and run them on cloud infrastructure. We pushed back on that instinct. A lift-and-shift would preserve all the problems of sequential batch processing — long run times, fragile recovery, no observability — and just move them to a different data centre. We chose a redesign instead.

## The Problem with Batch

JCL is a command language for sequencing jobs on IBM z/OS. It's expressive but fundamentally sequential: step 1 must finish before step 2 begins, and a failure in step 5 requires rolling back steps 1–4 manually. For a system that touches hundreds of regional budget allocations across dozens of business units, sequential processing is the bottleneck.

The mainframe system processed one region at a time. A failed run in EMEA didn't affect APAC, but it did block the overall job from completing. Operations teams maintained runbooks for each failure scenario. There were a lot of failure scenarios.

## The New Architecture

We modelled each regional budget distribution as an event. When the process starts, a `BudgetRunInitiated` event is published to a Kafka topic. Consumers pick it up, process their region independently, and publish a `RegionCompleted` or `RegionFailed` event when done. A coordinator service watches for all expected `RegionCompleted` events and publishes `BudgetRunFinalized` when the full set arrives.

```go filename="events/budget.go"
type BudgetRunInitiated struct {
	RunID       string    `json:"runId"`
	FiscalYear  int       `json:"fiscalYear"`
	Quarter     int       `json:"quarter"`
	Regions     []string  `json:"regions"`
	InitiatedAt time.Time `json:"initiatedAt"`
}

type RegionCompleted struct {
	RunID       string    `json:"runId"`
	Region      string    `json:"region"`
	RecordCount int       `json:"recordCount"`
	CompletedAt time.Time `json:"completedAt"`
}

type RegionFailed struct {
	RunID     string    `json:"runId"`
	Region    string    `json:"region"`
	Error     string    `json:"error"`
	FailedAt  time.Time `json:"failedAt"`
	Retryable bool      `json:"retryable"`
}
```

The `Retryable` flag is important. Some failures are transient — a downstream API was momentarily unavailable. Others are data errors that require human review. Transient failures are retried automatically with exponential backoff. Data errors publish to a dead-letter topic and alert the finance operations team.

## Parallel Processing

Because regions are independent, all of them can run in parallel. We deployed a regional processor as a Kubernetes `Deployment` with per-region consumer groups. Each group reads from the same Kafka topic but processes only events tagged with its region code.

This parallelism is what collapsed the run time. The mainframe processed regions serially over four days. With twelve regional processors running concurrently, the same workload completes in under ten hours — bounded by the slowest region, not the sum of all regions.

## Observability

One of the mainframe system's biggest weaknesses was observability. A failed run surfaced as a missing report; the only way to debug was to read JCL job logs. The event-driven architecture made every state transition observable. We shipped a simple dashboard that shows each region's current state (pending, processing, completed, failed) and overall run progress in real time.

Kafka consumer lag became our primary SLI. If a regional processor falls behind, it's visible within seconds. The old system gave us nothing until the job finished — or didn't.

## What We Preserved

Mainframe systems are often dismissed as technical debt, but they earn their longevity. The business logic inside those JCL jobs — the allocation rules, the rounding conventions, the edge cases accumulated over decades — was correct. We extracted it carefully, wrapped it in Go services with comprehensive unit tests, and treated the mainframe as the source of truth for validation. The first three production runs were compared record-by-record against a parallel mainframe execution. On run four, we decommissioned the mainframe job.

The lesson: migrate the architecture, not just the infrastructure. Sequential batch logic migrated to cloud is still sequential batch logic.
