---
"@neo4j/graphql": patch
---

Deprecate attribute filtering using the non-generic version such as `title_EQ: "The Matrix"` in favor of the generic input `title: { eq: "The Matrix" }`.
The setting `excludeDeprecatedFields` now contains the option `attributeFilters` to remove these deprecated filters.
