# Node Directive

Custom plural using @node.

Schema:

```graphql
type Tech @node(plural: "Techs") {
    name: String
}
```

---

## Select Tech with plural techs

### GraphQL Input

```graphql
{
    techs {
        name
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Tech)
RETURN this { .name } as this
```

### Expected Cypher Params

```json
{}
```

---

## Count Tech with plural techs

### GraphQL Input

```graphql
{
    techsCount
}
```

### Expected Cypher Output

```cypher
MATCH (this:Tech)
RETURN count(this)
```

### Expected Cypher Params

```json
{}
```

---

## Count Tech with plural techs using aggregation

### GraphQL Input

```graphql
{
    techsAggregate {
        count
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Tech)
RETURN { count: count(this) }
```

### Expected Cypher Params

```json
{}
```

---

## Create Tech with plural techs using aggregation

### GraphQL Input

```graphql
mutation {
    createTechs(input: [{ name: "Highlander" }]) {
        techs {
            name
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
    CREATE (this0:Tech)
    SET this0.name = $this0_name
    RETURN this0
}
RETURN this0 { .name } AS this0
```

### Expected Cypher Params

```json
{
    "this0_name": "Highlander"
}
```

---

## Update Tech with plural techs using aggregation

### GraphQL Input

```graphql
mutation {
    updateTechs(update: { name: "Matrix" }) {
        techs {
            name
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Tech)
SET this.name = $this_update_name
RETURN this { .name } AS this
```

### Expected Cypher Params

```json
{
    "this_update_name": "Matrix"
}
```

---

## Delete Tech with plural techs using aggregation

### GraphQL Input

```graphql
mutation {
    deleteTechs(where: { name: "Matrix" }) {
        nodesDeleted
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Tech)
WHERE this.name = $this_name
DETACH DELETE this
```

### Expected Cypher Params

```json
{
    "this_name": "Matrix"
}
```

---
