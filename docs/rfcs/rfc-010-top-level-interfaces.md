# Top-level Interfaces

## Problem

Interface types are currently only available to Query as part of a relationship field. 
Our users would like to be able to query for Interface types directly from the root Query type.

## Proposed Solution

Given the following type definitions:

```gql
interface Production {
  title: String!
}

type Movie implements Production {
  title: String!
}

type Series implements Production {
  title: String!
}
```

We would expect to see the following new field in the Query root type:

```gql
type Query {
  productions(options: ProductionOptions, where: ProductionWhere): [Production!]!
}
```

### Usage Examples

Using the type definitions above, let's look at some examples.

```gql
query {
  productions {
    title
  }
}
```

This would translate into:

```
CALL {
  MATCH (this:Movie)
  RETURN this { __resolveType: "Movie", .title }
UNION
  MATCH (this:Series)
  RETURN this { __resolveType: "Series", .title }
}
RETURN this
```

We can filter for any implementing type of `Production`:

```gql
query {
  productions(where: { title_CONTAINS: "Star Wars" }) {
    title
  }
}
```

This would produce:

```
CALL {
  MATCH (this:Movie)
  WHERE this.title CONTAINS "Star Wars"
  RETURN this { __resolveType: "Movie", .title }
UNION
  MATCH (this:Series)
  WHERE this.title CONTAINS "Star Wars"
  RETURN this { __resolveType: "Series", .title }
}
RETURN this
```

We can do some filtering for both types:

```gql
query {
  productions(where: { _on: { Movie: { title: "Forrest Gump" }, Series: { title: "Star Wars: The Clone Wars" } } }) {
    title
  }
}
```

Would produce:

```
CALL {
  MATCH (this:Movie)
  WHERE this.title = "Forrest Gump"
  RETURN this { __resolveType: "Movie", .title }
UNION
  MATCH (this:Series)
  WHERE this.title = "Star Wars: The Clone Wars"
  RETURN this { __resolveType: "Series", .title }
}
RETURN this
```

However, if we only filter on one of the types, we will only return that type to prevent overfetching:

```gql
query {
  productions(where: { _on: { Movie: { title: "Forrest Gump" } } }) {
    title
  }
}
```

Would produce:

```
CALL {
  MATCH (this:Movie)
  WHERE this.title = "Forrest Gump"
  RETURN this { __resolveType: "Movie", .title }
}
RETURN this
```

Now with some pagination and sorting:

```gql
query {
  productions(options: { limit: 10, offset: 10, sort: { title: ASC } }) {
    title
  }
}
```

Cypher:

```
CALL {
  MATCH (this:Movie)
  RETURN this { __resolveType: "Movie", .title }
UNION
  MATCH (this:Series)
  RETURN this { __resolveType: "Series", .title }
}
RETURN this ORDER BY this.title ASC SKIP 10 LIMIT 10
```

## Risks



### Security consideration

N/A

## Out of Scope

- Mutation fields for Interface types
