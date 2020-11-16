## Cypher Connect

Tests connect operations.

Schema:

```schema
type Product {
    id: ID!
    name: String
    sizes: [Size] @relationship(type: "HAS_SIZE", direction: "OUT")
    colors: [Color] @relationship(type: "HAS_COLOR", direction: "OUT")
    photos: [Photo] @relationship(type: "HAS_PHOTO", direction: "OUT")
}

type Size {
    id: ID!
    name: String!
}

type Color {
    id: ID!
    name: String!
    photos: [Photo] @relationship(type: "OF_COLOR", direction: "IN")
}

type Photo {
    id: ID!
    description: String!
    url: String!
    color: Color @relationship(type: "OF_COLOR", direction: "OUT")
}
```

---

### Recursive Connect

**GraphQL input**

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
              where: { name: "Red" }
              connect: {
                photos: [
                  {
                    where: { id: "123" }
                    connect: { color: { where: { id: "134" } } }
                  }
                ]
              }
            }
          ]
        }
        photos: {
          connect: [
            {
              where: { id: "321" }
              connect: { color: { where: { name: "Green" } } }
            }
            {
              where: { id: "33211" }
              connect: { color: { where: { name: "Red" } } }
            }
          ]
        }
      }
    ]
  ) {
    id
  }
}

```

**Expected Cypher output**

```cypher
CREATE (this0:Product)
SET this0.id = $this0_id
SET this0.name = $this0_name

WITH this0
OPTIONAL MATCH (this0_colors_connect0:Color)
WHERE this0_colors_connect0.name = $this0_colors_connect0_name
FOREACH(_ IN CASE this0_colors_connect0 WHEN NULL THEN [] ELSE [1] END |
    MERGE (this0)-[:HAS_COLOR]->(this0_colors_connect0)
)

    WITH this0, this0_colors_connect0
    OPTIONAL MATCH (this0_colors_connect0_photos0:Photo)
    WHERE this0_colors_connect0_photos0.id = $this0_colors_connect0_photos0_id
    FOREACH(_ IN CASE this0_colors_connect0_photos0 WHEN NULL THEN [] ELSE [1] END |
        MERGE (this0_colors_connect0)<-[:OF_COLOR]-(this0_colors_connect0_photos0)
    )

        WITH this0, this0_colors_connect0, this0_colors_connect0_photos0
        OPTIONAL MATCH (this0_colors_connect0_photos0_color0:Color)
        WHERE this0_colors_connect0_photos0_color0.id = $this0_colors_connect0_photos0_color0_id
        FOREACH(_ IN CASE this0_colors_connect0_photos0_color0 WHEN NULL THEN [] ELSE [1] END |
            MERGE (this0_colors_connect0_photos0)-[:OF_COLOR]->(this0_colors_connect0_photos0_color0)
        )

WITH this0
OPTIONAL MATCH (this0_photos_connect0:Photo)
WHERE this0_photos_connect0.id = $this0_photos_connect0_id
FOREACH(_ IN CASE this0_photos_connect0 WHEN NULL THEN [] ELSE [1] END |
    MERGE (this0)-[:HAS_PHOTO]->(this0_photos_connect0)
)

    WITH this0, this0_photos_connect0
    OPTIONAL MATCH (this0_photos_connect0_color0:Color)
    WHERE this0_photos_connect0_color0.name = $this0_photos_connect0_color0_name
    FOREACH(_ IN CASE this0_photos_connect0_color0 WHEN NULL THEN [] ELSE [1] END |
        MERGE (this0_photos_connect0)-[:OF_COLOR]->(this0_photos_connect0_color0)
    )

WITH this0
OPTIONAL MATCH (this0_photos_connect1:Photo)
WHERE this0_photos_connect1.id = $this0_photos_connect1_id
FOREACH(_ IN CASE this0_photos_connect1 WHEN NULL THEN [] ELSE [1] END |
    MERGE (this0)-[:HAS_PHOTO]->(this0_photos_connect1)
)

    WITH this0, this0_photos_connect1
    OPTIONAL MATCH (this0_photos_connect1_color0:Color)
    WHERE this0_photos_connect1_color0.name = $this0_photos_connect1_color0_name
    FOREACH(_ IN CASE this0_photos_connect1_color0 WHEN NULL THEN [] ELSE [1] END |
        MERGE (this0_photos_connect1)-[:OF_COLOR]->(this0_photos_connect1_color0)
    )

RETURN
this0 { .id } AS this0
```

**Expected Cypher params**

```cypher-params
{
  "this0_id": "123",
  "this0_name": "Nested Connect",
  "this0_colors_connect0_name": "Red",
  "this0_colors_connect0_photos0_id": "123",
  "this0_colors_connect0_photos0_color0_id": "134",
  "this0_photos_connect0_id": "321",
  "this0_photos_connect0_color0_name": "Green",
  "this0_photos_connect1_id": "33211",
  "this0_photos_connect1_color0_name": "Red"
}
```

---