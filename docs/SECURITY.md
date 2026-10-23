# Deployment boundaries

The service binds loopback by default. Non-loopback binds require ENGINE_TOKEN. Authentication is a shared administrative bearer token, not tenant isolation or role-based access control. All authenticated clients can administer the coordinator. Protect the network and terminate TLS before exposing credentials beyond a trusted host/network.

Mutations reject foreign browser origins and require JSON. CORS is not enabled. Console tokens remain in page memory. The server does not automatically trust proxy headers; a TLS reverse proxy must account for origin checking rather than blindly forwarding untrusted headers.

Static serving is restricted to console assets. Errors omit internal paths/stacks. Payloads are rendered as text. Custom handlers are trusted executable code. Avoid secrets in payloads, results, notes or diagnostic logs. The public repository contains no deployment credentials.
