---
"@neo4j/graphql": patch
---

Fix an authentication and authorization bypass on GraphQL Subscriptions. A JWT supplied by the client in the WebSocket connection parameters was trusted without verification; subscriptions now authenticate only with a cryptographically verified `token`, and a pre-decoded JWT is trusted only when set on the server-side context.
