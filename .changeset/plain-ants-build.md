---
"@neo4j/graphql": minor
---

Add support for `@cypher` directive of fields targeting types that do not use the `@node` directive. For example:

```graphql
type Movie @node {
    title: String
    id: String!
    link: Link!
        @cypher(
            statement: """
            MATCH(l:${Link})
            WHERE l.movieId=this.id
            RETURN l {.name, .url} as link
            """
            columnName: "link"
        )
}

type Link {
    movieId: String!
    url: String!
    name: String!
}
```
