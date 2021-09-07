# Cypher Disconnect

Tests connect operations. TODO: not properly tested

Schema:

```graphql
type Product {
    id: ID!
    name: String
    sizes: [Size] @relationship(type: "HAS_SIZE", direction: OUT)
    colors: [Color] @relationship(type: "HAS_COLOR", direction: OUT)
    photos: [Photo] @relationship(type: "HAS_PHOTO", direction: OUT)
}

type Size {
    id: ID!
    name: String!
}

type Color {
    id: ID!
    name: String!
    photos: [Photo] @relationship(type: "OF_COLOR", direction: IN)
}

type Photo {
    id: ID!
    description: String!
    url: String!
    color: Color @relationship(type: "OF_COLOR", direction: OUT)
}
```

---

## Recursive Connect

### GraphQL Input

```graphql
mutation {
    createProducts(
        input: [
            {
                id: "123"
                name: "Nested Connect"
                colors: {
                    connect: [
                        {
                            where: { node: { name: "Red" } }
                            connect: {
                                photos: [
                                    {
                                        where: { node: { id: "123" } }
                                        connect: {
                                            color: {
                                                where: { node: { id: "134" } }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
                photos: {
                    connect: [
                        {
                            where: { node: { id: "321" } }
                            connect: {
                                color: { where: { node: { name: "Green" } } }
                            }
                        }
                        {
                            where: { node: { id: "33211" } }
                            connect: {
                                color: { where: { node: { name: "Red" } } }
                            }
                        }
                    ]
                }
            }
        ]
    ) {
        products {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
    CREATE (this0:Product)
    SET this0.id = $this0_id
    SET this0.name = $this0_name

    WITH this0
    CALL {
        WITH this0
        OPTIONAL MATCH (this0_colors_connect0_node:Color)
        WHERE this0_colors_connect0_node.name = $this0_colors_connect0_node_name
        FOREACH(_ IN CASE this0_colors_connect0_node WHEN NULL THEN [] ELSE [1] END |
            MERGE (this0)-[:HAS_COLOR]->(this0_colors_connect0_node)
        )

        WITH this0, this0_colors_connect0_node
        CALL {
            WITH this0, this0_colors_connect0_node
            OPTIONAL MATCH (this0_colors_connect0_node_photos0_node:Photo)
            WHERE this0_colors_connect0_node_photos0_node.id = $this0_colors_connect0_node_photos0_node_id
            FOREACH(_ IN CASE this0_colors_connect0_node_photos0_node WHEN NULL THEN [] ELSE [1] END |
                MERGE (this0_colors_connect0_node)<-[:OF_COLOR]-(this0_colors_connect0_node_photos0_node)
            )

            WITH this0, this0_colors_connect0_node, this0_colors_connect0_node_photos0_node
            CALL {
                WITH this0, this0_colors_connect0_node, this0_colors_connect0_node_photos0_node
                OPTIONAL MATCH (this0_colors_connect0_node_photos0_node_color0_node:Color)
                WHERE this0_colors_connect0_node_photos0_node_color0_node.id = $this0_colors_connect0_node_photos0_node_color0_node_id
                FOREACH(_ IN CASE this0_colors_connect0_node_photos0_node_color0_node WHEN NULL THEN [] ELSE [1] END |
                    MERGE (this0_colors_connect0_node_photos0_node)-[:OF_COLOR]->(this0_colors_connect0_node_photos0_node_color0_node)
                )
                RETURN count(*)
            }
            RETURN count(*)
        }
        RETURN count(*)
    }

    WITH this0
    CALL {
        WITH this0
        OPTIONAL MATCH (this0_photos_connect0_node:Photo)
        WHERE this0_photos_connect0_node.id = $this0_photos_connect0_node_id
        FOREACH(_ IN CASE this0_photos_connect0_node WHEN NULL THEN [] ELSE [1] END |
            MERGE (this0)-[:HAS_PHOTO]->(this0_photos_connect0_node)
        )

        WITH this0, this0_photos_connect0_node
        CALL {
            WITH this0, this0_photos_connect0_node
            OPTIONAL MATCH (this0_photos_connect0_node_color0_node:Color)
            WHERE this0_photos_connect0_node_color0_node.name = $this0_photos_connect0_node_color0_node_name
            FOREACH(_ IN CASE this0_photos_connect0_node_color0_node WHEN NULL THEN [] ELSE [1] END |
                MERGE (this0_photos_connect0_node)-[:OF_COLOR]->(this0_photos_connect0_node_color0_node)
            )
            RETURN count(*)
        }
        RETURN count(*)
    }

    WITH this0
    CALL {
        WITH this0
        OPTIONAL MATCH (this0_photos_connect1_node:Photo)
        WHERE this0_photos_connect1_node.id = $this0_photos_connect1_node_id
        FOREACH(_ IN CASE this0_photos_connect1_node WHEN NULL THEN [] ELSE [1] END |
            MERGE (this0)-[:HAS_PHOTO]->(this0_photos_connect1_node)
        )

        WITH this0, this0_photos_connect1_node
        CALL {
            WITH this0, this0_photos_connect1_node
            OPTIONAL MATCH (this0_photos_connect1_node_color0_node:Color)
            WHERE this0_photos_connect1_node_color0_node.name = $this0_photos_connect1_node_color0_node_name
            FOREACH(_ IN CASE this0_photos_connect1_node_color0_node WHEN NULL THEN [] ELSE [1] END |
                MERGE (this0_photos_connect1_node)-[:OF_COLOR]->(this0_photos_connect1_node_color0_node)
            )
            RETURN count(*)
        }
        RETURN count(*)
    }

    RETURN this0
}

RETURN
this0 { .id } AS this0
```

### Expected Cypher Params

```json
{
    "this0_id": "123",
    "this0_name": "Nested Connect",
    "this0_colors_connect0_node_name": "Red",
    "this0_colors_connect0_node_photos0_node_id": "123",
    "this0_colors_connect0_node_photos0_node_color0_node_id": "134",
    "this0_photos_connect0_node_id": "321",
    "this0_photos_connect0_node_color0_node_name": "Green",
    "this0_photos_connect1_node_id": "33211",
    "this0_photos_connect1_node_color0_node_name": "Red"
}
```

---
