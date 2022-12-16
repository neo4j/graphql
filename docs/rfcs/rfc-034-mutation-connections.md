# Mutation connections

## Problem

To support better the logic separation between connections described in the RFC-033, this RFC proposes to introduce the support for root connections fields for Mutation query.

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

This RFC proposes to achieve the same by adding the type `ActorsConnection` as a possible response of the mutation `createActors` as:

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
as well as the type `MoviesConnection` to the type `CreateMoviesMutationResponse` and `UpdateMoviesMutationResponse`.

## Risks

-   None

### Security consideration

-   None
