---
"@neo4j/graphql": patch
---

Deprecated `DEFAULT_DIRECTED` / `DEFAULT_UNDIRECTED` `DIRECTED_ONLY` / `UNDIRECTED_ONLY` as `@relationship.queryDirection` argument values. The options that started with the `DEFAULT` are deprecated following the deprecation of the generated `directed` argument. The options with the suffix `_ONLY` have been changed to `DIRECTED` / `UNDIRECTED` as the suffix `_ONLY`.
