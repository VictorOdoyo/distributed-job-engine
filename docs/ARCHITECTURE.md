# Architecture

One authoritative coordinator exposes HTTP resources and serves the console. Remote workers use that API; they do not mount the database. Multiple local coordinator connections can share a local SQLite file, but this is not a replicated consensus system.

Writes use BEGIN IMMEDIATE with WAL, foreign keys, FULL synchronous durability and bounded busy waits. Job state, attempt records and lifecycle events commit together. Completion can atomically create outbox effects. Transactions are synchronous and reject nested/async callbacks.

Maintenance reaps expired attempts and advances schedules. A leased maintenance lock reduces duplicate scans; transaction constraints remain the correctness boundary. Database user_version prevents opening a newer schema accidentally.

The console polls bounded resource endpoints. Charts derive from committed events, not synthetic activity. Backend algorithms remain independent of the DOM.

Primary references: [Node 24 SQLite](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html), [SQLite transactions](https://www.sqlite.org/lang_transaction.html), [SQLite isolation](https://sqlite.org/isolation.html).
