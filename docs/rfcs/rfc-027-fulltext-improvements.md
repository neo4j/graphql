# `@fulltext` improvements

## Problem

* The use of fulltext indexes through the library does not currently allow for the returning of the score of each match
* There is currently no way to provide arguments that configure the parameters of the fulltext search

## Current solution

### Directive definition

```gql
input FullTextInput {
  name: String!
  fields: [String]!
}

"""
Informs @neo4j/graphql that there should be a fulltext index in the database, allows users to search by the index in the generated schema.
"""
directive @fulltext(indexes: [FullTextInput]!) on OBJECT
```

## Solution

### Future directive definition (*breaking*)

* `FullTextInput` renamed to `FulltextInput`
* `FullTextInput.name` renamed to `FulltextInput.indexName`
* `FullTextInput.queryName` added to give an option for naming the output Query field
* `FullTextInput.fields` elements made mandatory
* Specifying `FulltextInput` argument made mandatory 

```gql
input FulltextInput {
  queryName: String
  indexName: String!
  fields: [String!]!
}

"""
Informs @neo4j/graphql that there should be a fulltext index in the database, allows users to search by the index in the generated schema.
"""
directive @fulltext(indexes: [FulltextInput!]!) on OBJECT
```

### Returning the score (*breaking*)

We will need a return type which returns each node along with the confidence score of the fulltext match.

```gql
type MovieFulltextResult {
  score: Float!
  movie: Movie!
}
```

### New Query field to return result type

#### Automatically generating field name (*breaking*)

Given the following type definitions:

```gql
type Movie @fulltext(indexes: [{ indexName: "MovieTitle", fields: ["title"] }]) {
  title: String!
}
```

Would produce the following Query field:

```gql
type Query {
  movieFulltextMovieTitle(phrase: String!): [MovieFulltextResult!]!
}
```

#### With user provided Query name

Given the following type definitions:

```gql
type Movie @fulltext(indexes: [{ queryName: "moviesByTitle", indexName: "MovieTitle", fields: ["title"] }]) {
  title: String!
}
```

Would produce the following Query field:

```gql
type Query {
  moviesByTitle(phrase: String!): [MovieFulltextResult!]!
}
```

Example of querying:

```gql
query {
  moviesByTitle(phrase: "Matrix") {
    score
    movie {
      title
    }
  }
}
```

### Filtering, sorting and limiting

#### Filtering

Full-text queries should offer the opportunity to filter by fields within the returned type, as well as by the score of the full-text match.

Given the following type definitions:

```gql
type Movie @fulltext(indexes: [{ queryName: "moviesByTitle", indexName: "MovieTitle", fields: ["title"] }]) {
  title: String!
  releaseYear: Int!
}
```

Would produce the following Query field:

```gql
input FulltextScoreWhere {
  mix: Float
  max: Float
}

input MovieFulltextWhere {
  score: FulltextScoreWhere
  movie: MovieWhere
}

type Query {
  moviesByTitle(phrase: String!, where: MovieFulltextWhere): [MovieFulltextResult!]!
}
```

Usage example filtering by minimum score:

```gql
query {
  moviesByTitle(phrase: "Matrix", where: { score: { min: 0.5 } }) {
    score
    movie {
      title
    }
  }
}
```

Usage example filtering by minimum score and minimum releaseYear

```gql
query {
  moviesByTitle(phrase: "Matrix", where: { score: { min: 0.5 }, movie: { releaseYear_GT: 1980 } }) {
    score
    movie {
      title
    }
  }
}
```

#### Sorting

By default, results must be ordered by score descending. However, we will provide options to order.

Given the following type definitions:

```gql
type Movie @fulltext(indexes: [{ queryName: "moviesByTitle", indexName: "MovieTitle", fields: ["title"] }]) {
  title: String!
  releaseYear: Int!
}
```

Usage example ordering by minimum score ascending:

```gql
query {
  moviesByTitle(phrase: "Matrix", sort: { score: ASC }) {
    score
    movie {
      title
    }
  }
}
```

Usage example ordering by minimum score ascending and movie release year descending (order of sorts not guaranteed):

```gql
query {
  moviesByTitle(phrase: "Matrix", sort: { score: ASC, movie: { releaseYear: DESC } }) {
    score
    movie {
      title
    }
  }
}
```

Usage example ordering by minimum score ascending and movie release year descending (order of sorts guaranteed):

```gql
query {
  moviesByTitle(phrase: "Matrix", sort: [{ score: ASC }, { movie: { releaseYear: DESC } }]) {
    score
    movie {
      title
    }
  }
}
```

#### Offset and limit

Usage example ordering by minimum score ascending, offsetting by 2 and limiting to 10 results:

```gql
query {
  moviesByTitle(phrase: "Matrix", sort: { score: ASC }, offset: 2, limit: 10) {
    score
    movie {
      title
    }
  }
}
```

## Not right now

### Composite indexes over multiple node labels

```gql
type Movie @fulltext(indexes: [{ name: "Titles", fields: ["title"] }]) {
  title: String!
}

type Series @fulltext(indexes: [{ name: "Titles", fields: ["title"] }]) {
  title: String!
}

union Production = Movie | Series @fulltext(indexes: [{ name: "titles", fields: ["Movie.title", "Series.title"] }])
```

The result type for the above would look like so:

```gql
type ProductionFulltextResult {
  score: Float!
  production: Production!
}
```

### Configuration of the analyzer

Neo4j allows the configuration of the analyzer, for instance, to match against non-English words. 
We might want to add an argument to the `FulltextInput` in future so that this can be configured.

### `AND`/`OR` within `FulltextWhere`

With the solution above, filtering on full-text indexes will _combine_ the score filter with the node filter. In future,
we should provide logical operators within the filtering input to give the option to make this an `OR`.

### Full-text on relationship properties

Nope.
