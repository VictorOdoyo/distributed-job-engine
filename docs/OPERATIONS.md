# Operations

Use a local durable disk for SQLite. Do not place WAL files on network shares. Back up through backup(store,destination), which uses VACUUM INTO, rather than copying a live database file without its WAL. Existing backup destinations are rejected. Reopen backups with Store and run integrity(store).

Queue pause stops new claims, preserving active attempts. Worker draining stops claims while active execution continues. Retirement releases owned attempts for retry. These operations are audited. Notes add operational context without altering execution outcomes.

prune(store,{before,limit}) is explicit, bounded and opt-in. It preserves workflow/schedule references, active dedup keys, replay ancestry and undelivered effects. Events are retained independently and can grow; plan storage/archival policies for long-lived deployments.

UTC cron supports numeric lists, ranges and steps. Day-of-month/day-of-week use OR when both are restricted. Named months/weekdays and time zones are unsupported. Missed intervals either skip backlog or catch up in bounded batches. A scheduled occurrence is transactionally unique.
