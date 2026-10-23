# API

Import Store and functions from src/index.js. Create a Store(filename), submit(store,{queue,kind,payload}), registerWorker(store,options), claim(store,workerId), then complete(store,id,token,result). Close stores explicitly. Client provides the same worker lifecycle over HTTP. runWorker uses isolated handler threads.

HTTP JSON resources are under /api. GET overview, jobs, queues, workers, workflows, schedules, events, history, outbox and integrity inspect durable state. GET jobs/:id includes attempts, notes and events. GET traces/:id joins workflow/replay lineage.

POST jobs admits work; jobs/bulk admits up to 100 atomically. POST jobs/:id/cancel, replay, reschedule, heartbeat, complete, fail and notes operate on jobs. PUT jobs/:id/tags updates metadata. POST workers registers; workers/:id/claim, touch, status and retire coordinate execution. PUT queues/:name configures controls.

POST workflows accepts {name,nodes:[{key,job,dependsOn}]}. POST workflows/:id/cancel cancels a graph. POST schedules accepts exactly one intervalMs or five-field UTC cron. schedules/:id/pause accepts {paused}. POST maintenance triggers recovery/scheduling. Outbox claim, :id/ack and :id/retry use separate effect tokens.

Payloads/results are bounded JSON; request bodies are capped at 1 MiB. Responses use {error:{code,message}} on failure. 400 denotes validation, 401 authentication, 409 state/fencing conflict, 413 size, 429 admission/rate limits, and 503 busy storage. /health is a minimal unauthenticated liveness probe; /metrics requires configured authentication.
