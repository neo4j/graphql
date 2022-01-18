# Relationship Length Validation

## Problem

With the [RFC on relationship cardinality](https://github.com/neo4j/graphql/blob/dev/docs/rfcs/rfc-003-relationship-cardinality.md), we now have the ability to validate one-to-one relationships with Cypher. We cant however, due to the fact that GraphQL doesn't have any inbuilt mechanism to represent a range for related nodes, allow users to specify for example: "Movies must have at least one Actor".

## Proposed Solution

Expose new `validation` parameter to the `@relationship` directive, where the following can be specified:

1. `min`
2. `max`
3. `*_GT`
4. `*_GTE`
5. `*_LT`
6. `*_LTE`
7. `EQUAL`

For example:

"Movies must have at least one Actor":

```gql
type Movie {
    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT, validation: { min_GTE: 1 })
}
```

"Plane must have two pilots":

```gql
type Plane {
    pilots: [Pilot!]! @relationship(type: "FLYS", direction: OUT, validation: { EQUAL: 2 })
}
```

"Deck must have 52 cards":

```gql
type Deck {
    cards: [Card!]! @relationship(type: "HAS_CARD", direction: OUT, validation: { EQUAL: 52 })
}
```
