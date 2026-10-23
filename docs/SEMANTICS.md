# Delivery and state

Jobs progress from waiting or blocked to running, then succeeded, failed, cancelled or waiting for retry. Every claim increments the attempt number and creates a random lease token. Completion, failure and heartbeat require the current token and a strictly unexpired lease. Heartbeats never extend the original execution deadline.

At-least-once execution permits repeated external side effects after a crash. Fencing protects coordinator state, not arbitrary external services. Handlers must use downstream idempotency keys or transactional outbox effects. Outbox consumers should deduplicate by effect ID; delivery can repeat after acknowledgement loss.

Idempotency keys are scoped by queue, canonical request fingerprint and explicit TTL. Conflicting payloads return 409. Replaying terminal standalone jobs creates new IDs and preserves trace/source lineage. Workflow replay requires submitting a new graph.

Failed/cancelled parents cancel blocked descendants. Joins release only when every parent succeeds. Cancellation fences running attempts; external work may already have occurred. Worker retirement releases attempts immediately, while unexpected death relies on lease expiry.
