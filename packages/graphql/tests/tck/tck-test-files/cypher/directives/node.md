# Node Directive

Custom labels using @node.

Schema:

```graphql
type Movie @node(label:"Film") {
    id: ID
    title: String
}
```

---

## Single selection, Movie by title

### GraphQL Input

```graphql
{
    movies {
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Film)
RETURN this { .title } as this
```

### Expected Cypher Params

```json
{ }
```

---
