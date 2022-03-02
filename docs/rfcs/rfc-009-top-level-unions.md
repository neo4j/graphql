# Top-level Unions

## Problem

Union types are currently only available to Query as part of a relationship field. 
Our users would like to be able to query for Union types directly from the root Query type.

## Proposed Solution

Given the following type definitions:

```gql
type Movie {
  title: String!
}

type Series {
  title: String!
}

union Production = Movie | Series
```

We would expect to see the following new field in the Query root type:

```gql
type Query {
  productions(options: QueryOptions, where: ProductionWhere): [Production!]!
}
```

### Usage Examples

Using the type definitions above, let's look at some examples.

```gql
query {
  productions {
    ... on Movie {
      title
    }
    ... on Series {
      title
    }
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

We can do some filtering for both types:

```gql
query {
  productions(where: { Movie: { title: "Forrest Gump" }, Series: { title: "Star Wars: The Clone Wars" } }) {
    ... on Movie {
      title
    }
    ... on Series {
      title
    }
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
  productions(where: { Movie: { title: "Forrest Gump" } }) {
    ... on Movie {
      title
    }
    ... on Series {
      title
    }
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

Now with some pagination:

```gql
query {
  productions(options: { limit: 10, offset: 10 }) {
    ... on Movie {
      title
    }
    ... on Series {
      title
    }
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
RETURN this SKIP 10 LIMIT 10
```


## Risks



### Security consideration

N/A

## Out of Scope

- Mutation fields for Union types
