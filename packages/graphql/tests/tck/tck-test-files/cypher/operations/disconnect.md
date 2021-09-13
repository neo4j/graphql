# Cypher Disconnect

Tests disconnect operations.

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

## Recursive Disconnect

### GraphQL Input

```graphql
mutation {
    updateProducts(
        update: {
                id: "123"
                name: "Nested Connect"
                colors: {
                    disconnect: [
                        {
                            where: { node: { name: "Red" } }
                            disconnect: {
                                photos: [
                                    {
                                        where: { node: { id: "123" } }
                                        disconnect: {
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
                    disconnect: [
                        {
                            where: { node: { id: "321" } }
                            disconnect: {
                                color: { where: { node: { name: "Green" } } }
                            }
                        }
                        {
                            where: { node: { id: "33211" } }
                            disconnect: {
                                color: { where: { node: { name: "Red" } } }
                            }
                        }
                    ]
                }
            }
    ) {
        products {
            id
        }
    }
}
```

### Expected Cypher Output

```cypher
MATCH (this:Product)
SET this.id = $this_update_id
SET this.name = $this_update_name
WITH this
CALL {
  WITH this
  OPTIONAL MATCH (this)-[this_colors0_disconnect0_rel:HAS_COLOR]->(this_colors0_disconnect0:Color)
  WHERE this_colors0_disconnect0.name = $updateProducts.args.update.colors[0].disconnect[0].where.node.name
  FOREACH(_ IN
  CASE this_colors0_disconnect0
  WHEN NULL
  THEN []
  ELSE [1]
  END |
  DELETE this_colors0_disconnect0_rel )
  WITH this, this_colors0_disconnect0
  CALL {
  WITH this, this_colors0_disconnect0
  OPTIONAL MATCH (this_colors0_disconnect0)<-[this_colors0_disconnect0_photos0_rel:OF_COLOR]-(this_colors0_disconnect0_photos0:Photo)
  WHERE this_colors0_disconnect0_photos0.id = $updateProducts.args.update.colors[0].disconnect[0].disconnect.photos[0].where.node.id
  FOREACH(_ IN
  CASE this_colors0_disconnect0_photos0 WHEN NULL THEN [] ELSE [1] END |
  DELETE this_colors0_disconnect0_photos0_rel )
  WITH this, this_colors0_disconnect0, this_colors0_disconnect0_photos0 CALL {
  WITH this, this_colors0_disconnect0, this_colors0_disconnect0_photos0
  OPTIONAL MATCH (this_colors0_disconnect0_photos0)-[this_colors0_disconnect0_photos0_color0_rel:OF_COLOR]->(this_colors0_disconnect0_photos0_color0:Color)
  WHERE this_colors0_disconnect0_photos0_color0.id = $updateProducts.args.update.colors[0].disconnect[0].disconnect.photos.disconnect.color.where.node.id
  FOREACH(_ IN
  CASE this_colors0_disconnect0_photos0_color0 WHEN NULL THEN [] ELSE [1] END |
  DELETE this_colors0_disconnect0_photos0_color0_rel )
  RETURN count(*)
}
RETURN count(*) }
RETURN count(*) }
WITH this CALL {
  WITH this
  OPTIONAL MATCH (this)-[this_photos0_disconnect0_rel:HAS_PHOTO]->(this_photos0_disconnect0:Photo)
  WHERE this_photos0_disconnect0.id = $updateProducts.args.update.photos[0].disconnect[0].where.node.id FOREACH(_ IN
  CASE this_photos0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
  DELETE this_photos0_disconnect0_rel )
  WITH this, this_photos0_disconnect0 CALL {
  WITH this, this_photos0_disconnect0
  OPTIONAL MATCH (this_photos0_disconnect0)-[this_photos0_disconnect0_color0_rel:OF_COLOR]->(this_photos0_disconnect0_color0:Color)
  WHERE this_photos0_disconnect0_color0.name = $updateProducts.args.update.photos[0].disconnect.disconnect.color.where.node.name FOREACH(_ IN
  CASE this_photos0_disconnect0_color0 WHEN NULL THEN [] ELSE [1] END |
  DELETE this_photos0_disconnect0_color0_rel )
  RETURN count(*)
}
RETURN count(*) }
WITH this CALL {
WITH this
OPTIONAL MATCH (this)-[this_photos0_disconnect1_rel:HAS_PHOTO]->(this_photos0_disconnect1:Photo)
WHERE this_photos0_disconnect1.id = $updateProducts.args.update.photos[0].disconnect[1].where.node.id FOREACH(_ IN
CASE this_photos0_disconnect1 WHEN NULL THEN [] ELSE [1] END |
DELETE this_photos0_disconnect1_rel )
WITH this, this_photos0_disconnect1
CALL {
  WITH this, this_photos0_disconnect1
  OPTIONAL MATCH (this_photos0_disconnect1)-[this_photos0_disconnect1_color0_rel:OF_COLOR]->(this_photos0_disconnect1_color0:Color)
  WHERE this_photos0_disconnect1_color0.name = $updateProducts.args.update.photos[0].disconnect.disconnect.color.where.node.name FOREACH(_ IN
  CASE this_photos0_disconnect1_color0 WHEN NULL THEN [] ELSE [1] END |
  DELETE this_photos0_disconnect1_color0_rel )
  RETURN count(*)
}
RETURN count(*) }
RETURN this {
  .id
} AS this
```

### Expected Cypher Params

```json
{
    "this_update_id": "123",
    "this_update_name": "Nested Connect",
    "updateProducts": {
        "args": {
            "update": {
                "colors": [{
                    "disconnect": [{
                        "disconnect": {
                            "photos": [{
                                "disconnect": {
                                    "color": {
                                        "where": {
                                            "node": {
                                                "id": "134"
                                            }
                                        }
                                    }
                                },
                                "where": {
                                    "node": {
                                        "id": "123"
                                    }
                                }
                            }]
                        },
                        "where": {
                            "node": {
                                "name": "Red"
                            }
                        }
                    }]
                }],
                "id": "123",
                "name": "Nested Connect",
                "photos": [{
                    "disconnect": [{
                            "disconnect": {
                                "color": {
                                    "where": {
                                        "node": {
                                            "name": "Green"
                                        }
                                    }
                                }
                            },
                            "where": {
                                "node": {
                                    "id": "321"
                                }
                            }
                        },
                        {
                            "disconnect": {
                                "color": {
                                    "where": {
                                        "node": {
                                            "name": "Red"
                                        }
                                    }
                                }
                            },
                            "where": {
                                "node": {
                                    "id": "33211"
                                }
                            }
                        }
                    ]
                }]
            }
        }
    }
}
```

---
