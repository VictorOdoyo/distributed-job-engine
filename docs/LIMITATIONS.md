# Limits

SQLite serializes writers and is a single authoritative storage boundary. This repository does not offer cross-region replication, leader consensus or exactly-once external execution. Synchronous database work can delay the HTTP event loop at high volume. Benchmark numbers are observational, not production capacity guarantees.

Jobs allow 20 attempts, 64 KiB payload/result JSON, priorities -100..100 and a two-hour execution timeout. Queues default to 10000 pending jobs. Workers allow bounded concurrency; the provided runner caps capacity at 32. Workflows allow 100 nodes/500 edges. Notes are capped at 100 per job. Cron searches at most five years. Outbox completion allows at most 16 effects, subject to the overall HTTP body cap.

Queries and console lists are bounded, not exhaustive exports. Latency percentiles sample up to 10000 successful attempts in the last day. Metrics retain cumulative attempt history. Activity charts cover 30 minutes. Historical events, workflows and schedule occurrences require an operational storage policy.

Clock correctness matters for leases. Keep coordinator clocks synchronized; remote worker clocks are not the authority for accepting results. The supplied built-ins and fault tests demonstrate behavior on tested platforms, not arbitrary workloads or hostile handler containment.
