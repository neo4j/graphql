---
"@neo4j/graphql": patch
---

Deprecate relationship filtering using the non-generic version such as `actors_SOME: { title_EQ: "The Matrix" }` in favor of the generic input `actors: { some: { title: { eq: "The Matrix" } } }`.
The setting `excludeDeprecatedFields` now contains the option `relationshipFilters` to remove these deprecated filters.
