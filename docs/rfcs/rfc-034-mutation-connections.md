# Mutation connections

## Problem

To support better the logic separation between connections described in the RFC-033, this RFC proposes to introduce support for the top-level connections field in the Mutation responses.

Given the following Type definitions:

```graphql
type Actor {
    id: ID!
    name: String
    movies: [Movie!]! @relationship(type: "EMPLOYED", direction: OUT, properties: "ActedIn")
}

type Movie {
    id: ID!
    name: String
    actors: [Actor!]! @relationship(type: "EMPLOYED", direction: IN, properties: "ActedIn")
}

interface ActedIn @relationshipProperties {
    year: Int
}
```

For instance, consider the following GraphQL mutation:

```graphql
mutation CreateActors($input: [ActorCreateInput!]!) {
    createActors(input: $input) {
        actors {
            name
        }
    }
}
```

This RFC proposes to make connection fields queryable directly in the Selection Set.
For instance:

```graphql
mutation CreateActors($input: [ActorCreateInput!]!) {
    createActors(input: $input) {
        actorsConnection {
            edges {
                node {
                    name
                }
            }
        }
    }
}
```

## Proposed Solution

This solution proposes to add `ActorsConnection` to the types `CreateActorsMutationResponse` and `UpdateActorsMutationResponse`,
as well as the types `MoviesConnection` to the type `CreateMoviesMutationResponse` and `UpdateMoviesMutationResponse`.

## Risks

-   None

### Security consideration

-   None
