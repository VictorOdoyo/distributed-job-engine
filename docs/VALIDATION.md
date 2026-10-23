# Validation

Unit/integration tests cover admission, canonical deduplication, rate/capacity enforcement, leases at exact expiry boundaries, retries, permanent failure, cancellation, DAG joins/cycles/failure propagation, schedules, locks, outbox acknowledgements, retention, backups, API authentication and request bounds.

Independent processes contend for one SQLite file; tests assert every job receives one accepted attempt. A process exits after claiming work, then recovery fences its stale token. Separate worker CLI processes execute jobs over HTTP. Injected SQL triggers force an outbox write failure and verify complete rollback. Randomized lifecycle sequences independently inspect ownership invariants.

Browser verification runs actual workers and checks admission, invalid JSON, notes, replay, worker draining/resume, schedule pause/resume, workflow inspection, queue pause/resume, event history, charts and 390px layout overflow. Page errors fail the run. Screenshots are generated in ignored results/ for review.

The benchmark checks 1000 admissions/claims/completions and integrity using in-memory SQLite. Clean-package verification installs the TGZ without development dependencies, executes an isolated handler through HTTP and checks served assets. CI runs Windows/Linux library checks and Linux Chromium. Source releases include tests; runtime packages omit test fixtures.
