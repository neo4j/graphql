# Cypher Projection

Schema:

```schema
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
    location: Point
}
```

---

## Multi Create With Projection

Makes that the projection is generated correctly. Usage of `projection` var name.

### GraphQL Input

```graphql
mutation {
    createProducts(input: [{ id: "1" }, { id: "2" }]) {
        products {
            id
            photos(where: { url: "url.com" }) {
                url
                location {
                    latitude
                    longitude
                    height
                }
            }
            colors(where: { id: 123 }) {
                id
            }
            sizes(where: { name: "small" }) {
                name
            }
        }
    }
}
```

### Expected Cypher Output

```cypher
CALL {
  CREATE (this0:Product)
  SET this0.id = $this0_id

  RETURN this0
}

CALL {
  CREATE (this1:Product)
  SET this1.id = $this1_id

  RETURN this1
}

RETURN
this0 {
    .id,
    photos: [ (this0)-[:HAS_PHOTO]->(this0_photos:Photo) WHERE this0_photos.url = $projection_photos_url | this0_photos { .url, location: { point: this0_photos.location } } ],
    colors: [ (this0)-[:HAS_COLOR]->(this0_colors:Color) WHERE this0_colors.id = $projection_colors_id | this0_colors { .id } ],
    sizes: [ (this0)-[:HAS_SIZE]->(this0_sizes:Size) WHERE this0_sizes.name = $projection_sizes_name  | this0_sizes { .name } ]
} AS this0,
this1 {
    .id,
    photos: [ (this1)-[:HAS_PHOTO]->(this1_photos:Photo) WHERE this1_photos.url = $projection_photos_url | this1_photos { .url, location: { point: this1_photos.location } } ],
    colors: [ (this1)-[:HAS_COLOR]->(this1_colors:Color) WHERE this1_colors.id = $projection_colors_id | this1_colors { .id } ],
    sizes: [ (this1)-[:HAS_SIZE]->(this1_sizes:Size) WHERE this1_sizes.name = $projection_sizes_name  | this1_sizes { .name } ]
} AS this1
```

### Expected Cypher Params

```json
{
    "this0_id": "1",
    "this1_id": "2",
    "projection_photos_url": "url.com",
    "projection_colors_id": "123",
    "projection_sizes_name": "small"
}
```

---
