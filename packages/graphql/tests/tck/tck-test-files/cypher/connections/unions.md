## Cypher -> Connections -> Unions

Schema:

```schema
union Publication = Book | Journal

type Author {
    name: String!
    publications: [Publication] @relationship(type: "WROTE", direction: OUT, properties: "Wrote")
}

type Book {
    title: String!
    author: [Author!]! @relationship(type: "WROTE", direction: IN, properties: "Wrote")
}

type Journal {
    subject: String!
    author: [Author!]! @relationship(type: "WROTE", direction: IN, properties: "Wrote")
}

interface Wrote {
    words: Int!
}
```

---

### Projecting union node and relationship properties with no arguments

**GraphQL input**

```graphql
query {
    authors {
        name
        publicationsConnection {
            edges {
                words
                node {
                    ... on Book {
                        title
                    }
                    ... on Journal {
                        subject
                    }
                }
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Author)
CALL {
    WITH this
    CALL {
        WITH this
        OPTIONAL MATCH (this)-[this_wrote:WROTE]->(this_Book:Book)
        WITH { words: this_wrote.words, node: { __resolveType: "Book", title: this_Book.title } } AS edge
        RETURN edge
    UNION
        WITH this
        OPTIONAL MATCH (this)-[this_wrote:WROTE]->(this_Journal:Journal)
        WITH { words: this_wrote.words, node: { __resolveType: "Journal", subject: this_Journal.subject } } AS edge
        RETURN edge
    }
    WITH collect(edge) as edges, count(edge) as totalCount
    RETURN { edges: edges, totalCount: totalCount } AS publicationsConnection
}
RETURN this { .name, publicationsConnection } as this
```

**Expected Cypher params**

```cypher-params
{}
```

---

### Projecting union node and relationship properties with where argument

**GraphQL input**

```graphql
query {
    authors {
        name
        publicationsConnection(
            where: {
                Book: { node: { title: "Book Title" } }
                Journal: { node: { subject: "Journal Subject" } }
            }
        ) {
            edges {
                words
                node {
                    ... on Book {
                        title
                    }
                    ... on Journal {
                        subject
                    }
                }
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Author)
CALL {
    WITH this
    CALL {
        WITH this
        OPTIONAL MATCH (this)-[this_wrote:WROTE]->(this_Book:Book)
        WHERE this_Book.title = $this_publicationsConnection.args.where.Book.node.title
        WITH { words: this_wrote.words, node: { __resolveType: "Book", title: this_Book.title } } AS edge
        RETURN edge
    UNION
        WITH this
        OPTIONAL MATCH (this)-[this_wrote:WROTE]->(this_Journal:Journal)
        WHERE this_Journal.subject = $this_publicationsConnection.args.where.Journal.node.subject
        WITH { words: this_wrote.words, node: { __resolveType: "Journal", subject: this_Journal.subject } } AS edge
        RETURN edge
    }
    WITH collect(edge) as edges, count(edge) as totalCount
    RETURN { edges: edges, totalCount: totalCount } AS publicationsConnection
}
RETURN this { .name, publicationsConnection } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_publicationsConnection": {
        "args": {
            "where": {
                "Book": {
                    "node": {
                        "title": "Book Title"
                    }
                },
                "Journal": {
                    "node": {
                        "subject": "Journal Subject"
                    }
                }
            }
        }
    }
}
```

---

### Projecting union node and relationship properties with where relationship argument

**GraphQL input**

```graphql
query {
    authors {
        name
        publicationsConnection(
            where: {
                Book: { relationship: { words: 1000 } }
                Journal: { relationship: { words: 2000 } }
            }
        ) {
            edges {
                words
                node {
                    ... on Book {
                        title
                    }
                    ... on Journal {
                        subject
                    }
                }
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Author)
CALL {
    WITH this
    CALL {
        WITH this
        OPTIONAL MATCH (this)-[this_wrote:WROTE]->(this_Book:Book)
        WHERE this_wrote.words = $this_publicationsConnection.args.where.Book.relationship.words
        WITH { words: this_wrote.words, node: { __resolveType: "Book", title: this_Book.title } } AS edge
        RETURN edge
    UNION
        WITH this
        OPTIONAL MATCH (this)-[this_wrote:WROTE]->(this_Journal:Journal)
        WHERE this_wrote.words = $this_publicationsConnection.args.where.Journal.relationship.words
        WITH { words: this_wrote.words, node: { __resolveType: "Journal", subject: this_Journal.subject } } AS edge
        RETURN edge
    }
    WITH collect(edge) as edges, count(edge) as totalCount
    RETURN { edges: edges, totalCount: totalCount } AS publicationsConnection
}
RETURN this { .name, publicationsConnection } as this
```

**Expected Cypher params**

```cypher-params
{
    "this_publicationsConnection": {
        "args": {
            "where": {
                "Book": {
                    "relationship": {
                        "words": {
                            "low": 1000,
                            "high": 0
                        }
                    }
                },
                "Journal": {
                    "relationship": {
                        "words": {
                            "low": 2000,
                            "high": 0
                        }
                    }
                }
            }
        }
    }
}
```

---

### Projecting only one member of union node and relationship properties with no arguments

**GraphQL input**

```graphql
query {
    authors {
        name
        publicationsConnection {
            edges {
                words
                node {
                    ... on Book {
                        title
                    }
                }
            }
        }
    }
}
```

**Expected Cypher output**

```cypher
MATCH (this:Author)
CALL {
    WITH this
    CALL {
        WITH this
        OPTIONAL MATCH (this)-[this_wrote:WROTE]->(this_Book:Book)
        WITH { words: this_wrote.words, node: { __resolveType: "Book", title: this_Book.title } } AS edge
        RETURN edge
    }
    WITH collect(edge) as edges, count(edge) as totalCount
    RETURN { edges: edges, totalCount: totalCount } AS publicationsConnection
}
RETURN this { .name, publicationsConnection } as this
```

**Expected Cypher params**

```cypher-params
{}
```

---
