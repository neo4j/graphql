## Cypher Create Pringles

Tests operations for Pringles base case. see @ https://paper.dropbox.com/doc/Nested-mutations--A9l6qeiLzvYSxcyrii1ru0MNAg-LbUKLCTNN1nMO3Ka4VBoV

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
}
```

---

### Create Pringles

Test the creation of the Pringles.

**GraphQL input**

```graphql
mutation {
    createProducts(
        input: [
            {
                id: 1
                name: "Pringles"
                sizes: {
                    create: [
                        { id: 103, name: "Small" }
                        { id: 104, name: "Large" }
                    ]
                }
                colors: {
                    create: [
                        { id: 100, name: "Red" }
                        { id: 102, name: "Green" }
                    ]
                }
                photos: {
                    create: [
                        {
                            id: 105
                            description: "Outdoor photo"
                            url: "outdoor.png"
                        }
                        {
                            id: 106
                            description: "Green photo"
                            url: "g.png"
                            color: { connect: { where: { id: "102" } } }
                        }
                        {
                            id: 107
                            description: "Red photo"
                            url: "r.png"
                            color: { connect: { where: { id: "100" } } }
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

**Expected Cypher output**

```cypher
CALL {
  CREATE (this0:Product)
  SET this0.id = $this0_id
  SET this0.name = $this0_name

    WITH this0
    CREATE (this0_sizes0:Size)
    SET this0_sizes0.id = $this0_sizes0_id
    SET this0_sizes0.name = $this0_sizes0_name
    MERGE (this0)-[:HAS_SIZE]->(this0_sizes0)

    WITH this0
    CREATE (this0_sizes1:Size)
    SET this0_sizes1.id = $this0_sizes1_id
    SET this0_sizes1.name = $this0_sizes1_name
    MERGE (this0)-[:HAS_SIZE]->(this0_sizes1)

    WITH this0
    CREATE (this0_colors0:Color)
    SET this0_colors0.id = $this0_colors0_id
    SET this0_colors0.name = $this0_colors0_name
    MERGE (this0)-[:HAS_COLOR]->(this0_colors0)

    WITH this0
    CREATE (this0_colors1:Color)
    SET this0_colors1.id = $this0_colors1_id
    SET this0_colors1.name = $this0_colors1_name
    MERGE (this0)-[:HAS_COLOR]->(this0_colors1)

    WITH this0
    CREATE (this0_photos0:Photo)
    SET this0_photos0.id = $this0_photos0_id
    SET this0_photos0.description = $this0_photos0_description
    SET this0_photos0.url = $this0_photos0_url
    MERGE (this0)-[:HAS_PHOTO]->(this0_photos0)

    WITH this0
    CREATE (this0_photos1:Photo)
    SET this0_photos1.id = $this0_photos1_id
    SET this0_photos1.description = $this0_photos1_description
    SET this0_photos1.url = $this0_photos1_url

      WITH this0, this0_photos1
      OPTIONAL MATCH (this0_photos1_color_connect0:Color)
      WHERE this0_photos1_color_connect0.id = $this0_photos1_color_connect0_id
      FOREACH(_ IN CASE this0_photos1_color_connect0 WHEN NULL THEN [] ELSE [1] END |
        MERGE (this0_photos1)-[:OF_COLOR]->(this0_photos1_color_connect0)
      )
    MERGE (this0)-[:HAS_PHOTO]->(this0_photos1)

    WITH this0
    CREATE (this0_photos2:Photo)
    SET this0_photos2.id = $this0_photos2_id
    SET this0_photos2.description = $this0_photos2_description
    SET this0_photos2.url = $this0_photos2_url

      WITH this0, this0_photos2
      OPTIONAL MATCH (this0_photos2_color_connect0:Color)
      WHERE this0_photos2_color_connect0.id = $this0_photos2_color_connect0_id
      FOREACH(_ IN CASE this0_photos2_color_connect0 WHEN NULL THEN [] ELSE [1] END |
        MERGE (this0_photos2)-[:OF_COLOR]->(this0_photos2_color_connect0)
      )
    MERGE (this0)-[:HAS_PHOTO]->(this0_photos2)

  RETURN this0
}

RETURN this0 { .id } AS this0
```

**Expected Cypher params**

```cypher-params
{
  "this0_id": "1",
  "this0_name": "Pringles",
  "this0_sizes0_id": "103",
  "this0_sizes0_name": "Small",
  "this0_sizes1_id": "104",
  "this0_sizes1_name": "Large",
  "this0_colors0_id": "100",
  "this0_colors0_name": "Red",
  "this0_colors1_id": "102",
  "this0_colors1_name": "Green",
  "this0_photos0_id": "105",
  "this0_photos0_description": "Outdoor photo",
  "this0_photos0_url": "outdoor.png",
  "this0_photos1_id": "106",
  "this0_photos1_description": "Green photo",
  "this0_photos1_url": "g.png",
  "this0_photos1_color_connect0_id": "102",
  "this0_photos2_id": "107",
  "this0_photos2_description": "Red photo",
  "this0_photos2_url": "r.png",
  "this0_photos2_color_connect0_id": "100"
}
```

---

### Update Pringles Color

Changes the color of Pringles from Green to Light Green.

**GraphQL input**

```graphql
mutation {
    updateProducts(
        where: { name: "Pringles" }
        update: {
            photos: [
                {
                    where: { description: "Green Photo" }
                    update: {
                        description: "Light Green Photo"
                        color: {
                            connect: { where: { name: "Light Green" } }
                            disconnect: { where: { name: "Green" } }
                        }
                    }
                }
            ]
        }
    ) {
        products {
            id
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Product)
WHERE this.name = $this_name

WITH this
OPTIONAL MATCH (this)-[:HAS_PHOTO]->(this_photos0:Photo)
WHERE this_photos0.description = $this_photos0_description
CALL apoc.do.when(this_photos0 IS NOT NULL,
  "
    SET this_photos0.description = $this_update_photos0_description
    WITH this, this_photos0
    OPTIONAL MATCH (this_photos0)-[this_photos0_color0_disconnect0_rel:OF_COLOR]->(this_photos0_color0_disconnect0:Color)
    WHERE this_photos0_color0_disconnect0.name = $this_photos0_color0_disconnect0_name
    FOREACH(_ IN CASE this_photos0_color0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
      DELETE this_photos0_color0_disconnect0_rel
    )

    WITH this, this_photos0
    OPTIONAL MATCH (this_photos0_color0_connect0:Color)
    WHERE this_photos0_color0_connect0.name = $this_photos0_color0_connect0_name
    FOREACH(_ IN CASE this_photos0_color0_connect0 WHEN NULL THEN [] ELSE [1] END |
      MERGE (this_photos0)-[:OF_COLOR]->(this_photos0_color0_connect0)
    )

    RETURN count(*)
  ",
  "",
  {this:this, this_photos0:this_photos0, auth:$auth,this_update_photos0_description:$this_update_photos0_description,this_photos0_color0_disconnect0_name:$this_photos0_color0_disconnect0_name,this_photos0_color0_connect0_name:$this_photos0_color0_connect0_name}) YIELD value as _

RETURN this { .id } AS this
```

**Expected Cypher params**

```cypher-params
{
  "this_name": "Pringles",
  "this_photos0_description": "Green Photo",
  "this_update_photos0_description": "Light Green Photo",
  "this_photos0_color0_connect0_name": "Light Green",
  "this_photos0_color0_disconnect0_name": "Green",
  "auth": {
       "isAuthenticated": true,
       "roles": [],
       "jwt": {}
  }
}
```

---
