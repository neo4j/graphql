# No mixing - Opt-in GraphQL Cursor Connections Specification 

## Problem

The Neo4j Graphql library introduced the [GraphQL Cursor Connections Specification](https://relay.dev/graphql/connections.htm) in its API design.

As the [Connection spec](https://relay.dev/graphql/connections.htm) and the Neo4j Graphql library API design can differ a lot,
having a Query or Mutation using both syntaxes could result in a high-complexity operation.

Let's consider this typeDefs for the RFC:

```graphql
    type Actor  {
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

For instance, consider the following GraphQL query:

```graphql
query Actors {
  actors(options: {
    sort: [
      {
        id: DESC
      }
    ],
    limit: 3,
    offset: 10
    }) {
    name
    moviesConnection(first: 32, after: "YXJyYXljb25uZWN0aW9uOjA=") {
      edges {
        node {
          id
        }
      }
    }
    movies(options: { limit: 32, offset: 100}) {
      id
    }
  }
}
```
In the Query above is visible that the [Connection spec](https://relay.dev/graphql/connections.htm) has a different approach in the way of querying data and paginating it.

## Proposed Solution

The RFC proposes to keep the support of the [Connection spec](https://relay.dev/graphql/connections.htm) but does not allow the usage in conjunction with the Neo4j GraphQL API.
This means that the [Connection spec](https://relay.dev/graphql/connections.htm) will be no longer available from the Neo4j GraphQL types and vice versa.

The RFC proposes also that the [Connection spec](https://relay.dev/graphql/connections.htm) is not included by default during the schema augmentation phase, but it could be added by configuration.

### Deprecated syntaxes:

#### Querying connections in conjunction with the Neo4j GraphQL syntax:

```graphql
query Actors {
  actors {
    movies {
      actorsConnection {
        totalCount
      }
    }
  }
}
```

```graphql
query ActorsConnection {
  actorsConnection {
    edges {
      node {
        movies {
          name
        }
      }
    }
  }
}
```

### Schema changes

The following types should not be generated anymore, if not specified differently in the configuration:
- ActorsConnection & MovieConnection
- ActorMoviesConnection & MovieActorsConnection
- ActorEdge & MovieEdge
- ActorMoviesRelationship & MovieActorsRelationship
- PageInfo


###  Configuration

This RFC proposes to make the [Connection spec](https://relay.dev/graphql/connections.htm) optional and isolated from the Neo4j GraphQL syntax.
The configuration can be done by adding the boolean attribute `enableRelayCursorConnection` to the `Neo4jGraphQLConfig`.

```typescript
interface Neo4jGraphQLConfig {
    enableRelayCursorConnection: boolean;
}
```

## Risks

- This RFC proposes many breaking changes. This may slow down the adoption of the new version of the library.
- Disable the Relay spec making the edge properties no longer accessible.
- Type `ActorWhere` and `MovieWhere` still contains: `moviesConnection_SOME`, `moviesConnection_ALL`, `moviesConnection_NONE`, `moviesConnection_SINGLE` it could be confusing and ambiguous to the users, see [Connection Filters](#connection-filters).

### Security consideration

- None

## Out of Scope

- Pagination changes.

## References

### Connection Filters

Using the [Connection spec](https://relay.dev/graphql/connections.htm) as filter in a Neo4j GraphQL syntax. 

```graphql
query Actors{
  actors(where: {
    moviesConnection_SOME: {
      edge: {
        year: null
      }
    }
  }) {
    name
  }
}
```
