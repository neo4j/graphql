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

## Count Movie with plural films

### GraphQL Input

```graphql
{
    filmsCount
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN count(this)
```

### Expected Cypher Params

```json
{}
```

---

## Count Movie with plural films using aggregation

### GraphQL Input

```graphql
{
    filmsAggregate {
        count
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
RETURN { count: count(this) }
```

### Expected Cypher Params

```json
{}
```

---

## Create Movie with plural films using aggregation

### GraphQL Input

```graphql
mutation {
    createfilms(input: [{ title: "Highlander" }]) {
        films {
            title
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
    CREATE (this0:Movie)
    SET this0.title = $this0_title
    RETURN this0
}
RETURN this0 { .title } AS this0
```

### Expected Cypher Params

```json
{
    "this0_title": "Highlander"
}
```

---
