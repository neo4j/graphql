---
"@neo4j/graphql": major
---

There have been major changes to the way that full-text search operates.

The directive now requires the specification of an index name, query name, and indexed fields.

```graphql
input FulltextInput {
  indexName: String!
  queryName: String!
  fields: [String]!
}

"""
Informs @neo4j/graphql that there should be a fulltext index in the database, allows users to search by the index in the generated schema.
"""
directive @fulltext(indexes: [FulltextInput]!) on OBJECT
```

Here is an example of how this might be used:

```graphql
type Movie @node @fulltext(indexName: "movieTitleIndex", queryName: "moviesByTitle", fields: ["title"]) {
  title: String!
}
```

Full-text search was previously available in two different locations.

The following form has now been completely removed:

```graphql
# Removed
{
  movies(fulltext: { movieTitleIndex: { phrase: "The Matrix" } }) {
    title
  }
}
```

The following form as a root-level query has been changed:

```graphql
# Old query
query {
  moviesByTitle(phrase: "The Matrix") {
    score
    movies {
      title
    }
  }
}

# New query
query {
  moviesByTitle(phrase: "The Matrix") {
    edges {
      score
      node {
        title
      }
    }
  }
}
```

The new form is as a Relay connection, which allows for pagination using cursors and access to the `pageInfo` field.
