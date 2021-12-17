# Query Limits

## Problem

Users want to be able to hard limit the maximum number of results that can be returned from a query.

## Proposed Solution

A new directive, `@queryOptions` to be added, which has an argument `limit` for specifying the maximum number of nodes for this type which should be returned from a query.

The minimum value for `limit` should be 1.

### Usage example

#### Root query field

```graphql
type Movie @queryOptions(limit: 10) {
  title: String!
}
```

Would result in the following type definitions being generated:

```graphql
input MovieOptions {
  offset: Int
  limit: Int! = 10
  sort: [MovieSort]
}

type Query {
  movies(where: MovieWhere, options: MovieOptions): [Movie!]!
}
```

Given a Neo4j database containing more than 10 `Movie` nodes, a query with no arguments like the following would return 10 results.

```graphql
{
  movies {
    title
  }
}
```

The Cypher output for the query above would be something along the lines of:

```cypher
MATCH (m:Movie)
RETURN m
LIMIT 10
```

If desired, the user could request less:

```graphql
{
  movies(options: { limit: 5 }) {
    title
  }
}
```

The Cypher output for the query above would be something along the lines of:

```cypher
MATCH (m:Movie)
RETURN m
LIMIT 5
```

However, if they request more than the limit, they will only receive the maximum number of results specified in the type definitions. For example, the following query would only have 10 results returned:

```graphql
{
  movies(options: { limit: 15 }) {
    title
  }
}
```

The Cypher output for the query above would be something along the lines of (note the `LIMIT` value of 10 and not 15):

```cypher
MATCH (m:Movie)
RETURN m
LIMIT 10
```

#### Relationship field

```graphql
type Movie @queryOptions(limit: 10) {
  title: String!
}

type Actor {
  name: String!
  movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
}
```

Would result in the following type definitions being generated (snippet only):

```graphql
input MovieOptions {
  offset: Int
  limit: Int! = 10
  sort: [MovieSort]
}

type Actor {
  name: String!
  movies(where: MovieWhere, options: MovieOptions): [Movie!]!
  moviesConnection(where: ActorMoviesConnectionWhere, sort: [ActorMoviesConnectionSort!], first: Int! = 10, after: String): ActorMoviesConnection!
}
```

Note that in addition to the default value for `limit` in the `MovieOptions` type, we have also had to set the default value for the `first` argument on the `moviesConnection` field.

From this point on, the behaviour will be identical to above.

## Risks

* Make sure the limit applies to *every* possible way of querying a type
* This doesn't provide a solution to the maximum number of results returned in an entire query
* This doesn't provide a solution to query complexity

## Out of Scope

### Global limit

Provide a way to specify a limit to all types without explicitly specifying it on each type.

### Throwing errors on violations

Throwing an error if a user passes in a limit value over the defined maximum. Maybe use the `@constraint` directive (https://www.npmjs.com/package/graphql-constraint-directive)?

```graphql
input MovieOptions {
  offset: Int
  limit: Int! = 10 @constraint(max: 10) # Error should be thrown if value over 10 passed in
  sort: [MovieSort]
}
```
