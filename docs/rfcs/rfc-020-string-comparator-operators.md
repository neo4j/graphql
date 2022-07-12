# String Comparator operators

## Problem
In some cases is useful to compare two strings in Lexicographic order, currently is not possible to use the Neo4j GraphQL library to replicate the behavior of a Cypher statement like: `MATCH(n) WHERE n.stringProp < "string value" RETURN n`.
This RFC describes solutions to expose the Cypher string operators `<, >, <=, >=` in the Neo4j GraphQL API. 

## Proposed Solution
Add new fields, used as String comparators, in all the `Where` input types that contain string properties.

**Operators Syntax:**
- `{property name}_GT`
- `{property name}_GTE`
- `{property name}_LT`
- `{property name}_LTE`


### Usage Examples
Given the following type definitions:
```graphql
type Movie {
    id: ID @id
    title: String
}
```
For instance, as the type `Movie` has the property title, it will be possible to select all the sequels of the movie `The Matrix` with a query like: 

```graphql
query MatrixSequels {
  movies(where: {
    title_STARTS_WITH: "The Matrix"
    title_GT: "The Matrix"
  }) {
    title
  }
}
```

that could be then translated to a Cypher like:
```cypher
MATCH(m:Movie)
WHERE m.title STARTS WITH "The Matrix" AND m.title > "The Matrix"
RETURN m.title 
```

Assuming that `The Matrix`, `The Matrix Reloaded`, `The Matrix Revolutions` are presents in the Neo4j instance then we can expect that `The Matrix Reloaded` and `The Matrix Revolutions` are returned.

### Technical considerations

#### Schema size
The proposed solution could increase the size of the augmented schema noticeably.
This could be mitigated by the RFC-019 Optional features

## Risks
- Schema size.

### Security consideration
None.

## Out of Scope
- Any others fields outside the GraphQL String types.
- Lists of String types.