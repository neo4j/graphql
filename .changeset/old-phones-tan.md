---
"@neo4j/graphql": patch
---

Check jwt token exp claim on subscription events and stop sending events on if token is expired.
In order to avoid missing events it is the user's responsibility to ensure the jwt is valid at all times, or to create a new subscription before the jwt expires.
