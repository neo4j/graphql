---
"@neo4j/graphql": major
---

Aliased properties are now automatically escaped using backticks. If you were using backticks in the `property` argument of your `@alias` directives, these should now be removed.
