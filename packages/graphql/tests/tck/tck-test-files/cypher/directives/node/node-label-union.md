# Node directive with unions

Tests for queries custom labels with unions.

Schema:

```graphql
union Search = Movie | Genre

type Genre @node(label: "Category", additionalLabels: ["ExtraLabel1", "ExtraLabel2"]) {
    name: String
}

type Movie @node(label: "Film") {
    title: String
    search: [Search] @relationship(type: "SEARCH", direction: OUT)
}
```

---

## Read Unions

### GraphQL Input

```graphql
{
    movies(where: { title: "some title" }) {
        search(
            where: { Movie: { title: "The Matrix" }, Genre: { name: "Horror" } }
            options: { offset: 1, limit: 10 }
        ) {
            ... on Movie {
                title
            }
            ... on Genre {
                name
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Film)
WHERE this.title = $this_title

RETURN this {
    search: [this_search IN [(this)-[:SEARCH]->(this_search)
        WHERE
            ("Category" IN labels(this_search) AND
                "ExtraLabel1" IN labels(this_search) AND
                "ExtraLabel2" IN labels(this_search))
                OR ("Film" IN labels(this_search)) |
        head(
            [ this_search IN [this_search]
                WHERE
                    ("Category" IN labels(this_search) AND
                        "ExtraLabel1" IN labels(this_search) AND
                        "ExtraLabel2" IN labels(this_search))
                AND
                this_search.name = $this_search_Genre_name |
                this_search {
                    __resolveType: "Genre",
                     .name
                } ] +
            [ this_search IN [this_search]
                WHERE ("Film" IN labels(this_search)) AND
                this_search.title = $this_search_Movie_title |
                this_search {
                    __resolveType: "Movie",
                    .title
                } ]
        )
    ] WHERE this_search IS NOT NULL] [1..11]
} as this
```

### Expected Cypher Params

```json
{
    "this_title": "some title",
    "this_search_Genre_name": "Horror",
    "this_search_Movie_title": "The Matrix"
}
```

---
