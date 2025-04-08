---
"@neo4j/graphql": major
---

The deprecated `directed` argument has been removed, and `queryDirection` now only accepts two possible values - `DIRECTED` (default) and `UNDIRECTED`.

Additionally, the `directedArgument` setting of `excludeDeprecatedFields` has been removed as these deprecated fields have been removed.
