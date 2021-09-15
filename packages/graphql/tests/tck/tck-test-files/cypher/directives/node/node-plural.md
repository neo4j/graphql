# Node Directive

Custom plural using @node.

Schema:

```graphql
type Movie @node(plural: "films") {
    title: String
}
```

---

## Select Movie with plural films

### GraphQL Input

```graphql
{
    films {
        title
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN this { .title } as this
```

### Expected Cypher Params

```json
{}
```

---
