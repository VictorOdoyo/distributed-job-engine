# Contributing

Use Node 24, npm ci, npm test, npm run benchmark and npm run format:check. Install Chromium and run npm run test:browser for console or worker changes. npm run package:check verifies the installable runtime.

Keep transitions transactional and include independent failure or concurrency tests. Never accept stale lease tokens, silently drop JSON values, or claim exactly-once external execution. Preserve typed public errors and explicit resource limits. Update API and semantics docs with contract changes. Use focused commits describing concrete behavior. Do not commit databases, tokens, generated runtime data or node_modules.
