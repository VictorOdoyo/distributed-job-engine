# Workers

Run npm run worker -- --url http://127.0.0.1:4177 --queues media,analytics --capacity 4. ENGINE_TOKEN supplies authentication without placing a secret in command arguments. --max-jobs bounds claimed attempts for batch runs. --handlers selects a trusted local ES module exporting async handle(job,context), returning {result,effects?}.

Each attempt runs in a disposable worker thread with a parent-side timeout and memory limits. Threads are isolation for resource control, not a security sandbox for hostile code. Custom modules have the worker process filesystem/network privileges. CPU-bound handlers cannot prevent parent lease renewal. Shutdown stops claims, allows a grace period, aborts remaining threads and retires the worker.

Built-ins: hash.batch computes SHA-256 strings, report.aggregate computes numeric summaries, text.normalize canonicalizes text, sleep supports bounded delays, flaky demonstrates deterministic transient failure, permanent.fail demonstrates dead letters, and outbox.publish creates a durable effect.

Errors default to retryable; set retryable=false for permanent failures. Unknown kinds and invalid built-in inputs are permanent. Lease loss aborts execution; recovery remains the coordinator's responsibility. Use unique identities for restarted workers.
