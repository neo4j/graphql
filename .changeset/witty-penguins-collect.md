---
"@neo4j/graphql": major
---

Relationship type strings are now automatically escaped using backticks. If you were using backticks in the `type` argument of your `@relationship` directives, these should now be removed to avoid backticks being added into your relationship type labels.
