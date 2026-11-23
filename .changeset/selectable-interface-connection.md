---
"@neo4j/graphql": patch
---

Fix `@selectable(onRead: false)` being bypassed through an interface relationship connection when another implementation of the interface allows reads.

Implementations that disable reads on an interface relationship now get their own connection type, for example `MovieActorsConnection` instead of `ProductionActorsConnection`.
