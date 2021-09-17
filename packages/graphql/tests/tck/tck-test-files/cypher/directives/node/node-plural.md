# Node Directive

Custom plural using @node.

Schema:

```graphql
type Movie @node(plural: "Films") {
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
    createFilms(input: [{ title: "Highlander" }]) {
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

## Update Movie with plural films using aggregation

### GraphQL Input

```graphql
mutation {
    updateFilms(update: { title: "Matrix" }) {
        films {
            title
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
SET this.title = $this_update_title
RETURN this { .title } AS this
```

### Expected Cypher Params

```json
{
    "this_update_title": "Matrix"
}
```

---

## Delete Movie with plural films using aggregation

### GraphQL Input

```graphql
mutation {
    deleteFilms(where: { title: "Matrix" }) {
        nodesDeleted
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Movie)
WHERE this.title = $this_title
DETACH DELETE this
```

### Expected Cypher Params

```json
{
    "this_title": "Matrix"
}
```

---
