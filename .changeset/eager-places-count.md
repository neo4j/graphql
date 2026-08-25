---
"@neo4j/graphql": patch
---

`@vector` provider configuration is now validated at schema build time.

Previously, when a `@vector` index declared a `provider` but no matching
configuration was supplied in `features.vector`, this only surfaced as an error
at query time.
