# Pagination 2.0 API

## Problem
Pagination API is inconsistent between nested fields, connections and top-level fields. 
With limit and cursor based paginations mixed together

### Offset vs Cursor
> TODO: Add basic explanation of both options

### Normal Fields

**Top level pagination**
```graphql
query BottomMovies{
  movies(options: {
    sort: {
      title: DESC
    },
    limit: 3
    offset: 3
  }) {
    title
  }
}
```

**Nested level pagination**
```graphql
query MoviesSortedByActors {
  movies {
    actors(options: {
      sort: {name: DESC},
      limit: 2,
      offset: 2
    }) {
      name
    }
  }
}
```

> Note that "normal" fields are paginated using limit and are consistent between top level and nested

### Connection fields

**Top level connection**
```graphql
query MoviesConnection {
  moviesConnection(sort: {
    title: DESC
  }, first: 3, after: "YXJyYXljb25uZWN0aW9uOjE=") {
    edges {
      node {
        title
      }
      cursor
    }
  }
}
```

**Nested connection**
```graphql
query SortMoviesByActorConnection {
  movies {
    actorsConnection(sort: {node: { name: DESC}}, first: 2, after: "YXJyYXljb25uZWN0aW9uOjE=") {
      edges {
        node {
          name
        }
        cursor
      }
    }
  }
}
```

**Nested connection by relationship**
In this example we will be sorting by the relationship fields
```graphql
query MoviesSortedByRelationship {
  movies {
    actorsConnection(sort: {edge: {year: DESC}}, first: 1, after: "YXJyYXljb25uZWN0aW9uOjE=") {
      edges {
        year
        node {
          name
        }
      }
    }
  }
}
```

Note:
* Connections use cursor based pagination, using first and after fields
* Connections do **not** have an `options` field, all sorting and pagination is defined in the input parameters directly.
* Relationship fields can **only** be queried with connection fields (this may be what we want)
* Connections cannot be paginated with limit
* Sort interface is different between nested and top level connection (missing `node` in top-level)



## What we want
* Consistent nested vs non-nested API
* Consistent connections vs normal fields API
* Be able to use cursor based pagination **or** offset based pagination, but not both at the same time
* We want to be able to use offset on connections and cursor on normal fields
* We want to be able to sort on relationships fields for connections using offset pagination
* [Sorting on aggregations](https://github.com/neo4j/graphql/issues/1156)

## Open Questions

* Do we want to change the underlying implementation of cursors so those use constant indexes
* Sorting on multiple fields (`sort: [{title: ASC}, {age: ASC}]` vs {title: ASC, age: ASC}`).
* [Default sorting](https://github.com/neo4j/graphql/issues/499)
* [Deep sorting](https://github.com/neo4j/graphql/issues/145)

## Proposed solution

* How to select offset vs cursor? (probably a server config flag)

### Offset pagination API

#### Simple Queries

**Example**
```graphql
query BottomMovies {
  movies(options: {
    sort: {
      title: DESC
    },
    limit: 3
    offset: 3
  }) {
    title
  }
}
```


#### Connections

**Example**
> TODO

#### Aggregations

**Example**
> TODO

### Cursor pagination API

#### Simple Queries

**Example**
> TODO

#### Connections

**Example**
> TODO

#### Aggregations

**Example**
> TODO

## Out of scope and future work
* Re-Implementation of cursors



