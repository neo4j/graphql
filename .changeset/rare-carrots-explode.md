---
"@neo4j/graphql": patch
---

Fixed incorrect behavior when using relationship-specific filters as `_SOME`/`_SINGLE`/`_NONE`/`_ALL` when the target of the filter was an interface. 
