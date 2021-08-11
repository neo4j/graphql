# Cypher -> Connections -> Unions

Schema:

```graphql
union Publication = Book | Journal

type Author {
    name: String!
    publications: [Publication]
        @relationship(type: "WROTE", direction: OUT, properties: "Wrote")
}

type Book {
    title: String!
    author: [Author!]!
        @relationship(type: "WROTE", direction: IN, properties: "Wrote")
}

type Journal {
    subject: String!
    author: [Author!]!
        @relationship(type: "WROTE", direction: IN, properties: "Wrote")
}

interface Wrote {
    words: Int!
}
```

---

## Projecting union node and relationship properties with no arguments

### GraphQL Input

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

### Expected Cypher Output

```cypher
MATCH (this:Author)
CALL {
    WITH this
    CALL {
        WITH this
        MATCH (this)-[this_wrote:WROTE]->(this_Book:Book)
        WITH { words: this_wrote.words, node: { __resolveType: "Book", title: this_Book.title } } AS edge
        RETURN edge
    UNION
        WITH this
        MATCH (this)-[this_wrote:WROTE]->(this_Journal:Journal)
        WITH { words: this_wrote.words, node: { __resolveType: "Journal", subject: this_Journal.subject } } AS edge
        RETURN edge
    }
    WITH collect(edge) as edges, count(edge) as totalCount
    RETURN { edges: edges, totalCount: totalCount } AS publicationsConnection
}
RETURN this { .name, publicationsConnection } as this
```

### Expected Cypher Params

```json
{}
```

---

## Projecting union node and relationship properties with where argument

### GraphQL Input

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

### Expected Cypher Output

```cypher
MATCH (this:Author)
CALL {
    WITH this
    CALL {
        WITH this
        MATCH (this)-[this_wrote:WROTE]->(this_Book:Book)
        WHERE this_Book.title = $this_publicationsConnection.args.where.Book.node.title
        WITH { words: this_wrote.words, node: { __resolveType: "Book", title: this_Book.title } } AS edge
        RETURN edge
    UNION
        WITH this
        MATCH (this)-[this_wrote:WROTE]->(this_Journal:Journal)
        WHERE this_Journal.subject = $this_publicationsConnection.args.where.Journal.node.subject
        WITH { words: this_wrote.words, node: { __resolveType: "Journal", subject: this_Journal.subject } } AS edge
        RETURN edge
    }
    WITH collect(edge) as edges, count(edge) as totalCount
    RETURN { edges: edges, totalCount: totalCount } AS publicationsConnection
}
RETURN this { .name, publicationsConnection } as this
```

### Expected Cypher Params

```json
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

## Projecting union node and relationship properties with where relationship argument

### GraphQL Input

```graphql
query {
    authors {
        name
        publicationsConnection(
            where: {
                Book: { edge: { words: 1000 } }
                Journal: { edge: { words: 2000 } }
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

### Expected Cypher Output

```cypher
MATCH (this:Author)
CALL {
    WITH this
    CALL {
        WITH this
        MATCH (this)-[this_wrote:WROTE]->(this_Book:Book)
        WHERE this_wrote.words = $this_publicationsConnection.args.where.Book.edge.words
        WITH { words: this_wrote.words, node: { __resolveType: "Book", title: this_Book.title } } AS edge
        RETURN edge
    UNION
        WITH this
        MATCH (this)-[this_wrote:WROTE]->(this_Journal:Journal)
        WHERE this_wrote.words = $this_publicationsConnection.args.where.Journal.edge.words
        WITH { words: this_wrote.words, node: { __resolveType: "Journal", subject: this_Journal.subject } } AS edge
        RETURN edge
    }
    WITH collect(edge) as edges, count(edge) as totalCount
    RETURN { edges: edges, totalCount: totalCount } AS publicationsConnection
}
RETURN this { .name, publicationsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_publicationsConnection": {
        "args": {
            "where": {
                "Book": {
                    "edge": {
                        "words": {
                            "low": 1000,
                            "high": 0
                        }
                    }
                },
                "Journal": {
                    "edge": {
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

## Projecting union node and relationship properties with where node and relationship argument

### GraphQL Input

```graphql
query {
    authors {
        name
        publicationsConnection(
            where: {
                Book: { edge: { words: 1000 }, node: { title: "Book Title" } }
                Journal: {
                    edge: { words: 2000 }
                    node: { subject: "Journal Subject" }
                }
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

### Expected Cypher Output

```cypher
MATCH (this:Author)
CALL {
    WITH this
    CALL {
        WITH this
        MATCH (this)-[this_wrote:WROTE]->(this_Book:Book)
        WHERE this_Book.title = $this_publicationsConnection.args.where.Book.node.title AND this_wrote.words = $this_publicationsConnection.args.where.Book.edge.words
        WITH { words: this_wrote.words, node: { __resolveType: "Book", title: this_Book.title } } AS edge
        RETURN edge
    UNION
        WITH this
        MATCH (this)-[this_wrote:WROTE]->(this_Journal:Journal)
        WHERE this_Journal.subject = $this_publicationsConnection.args.where.Journal.node.subject AND this_wrote.words = $this_publicationsConnection.args.where.Journal.edge.words
        WITH { words: this_wrote.words, node: { __resolveType: "Journal", subject: this_Journal.subject } } AS edge
        RETURN edge
    }
    WITH collect(edge) as edges, count(edge) as totalCount
    RETURN { edges: edges, totalCount: totalCount } AS publicationsConnection
}
RETURN this { .name, publicationsConnection } as this
```

### Expected Cypher Params

```json
{
    "this_publicationsConnection": {
        "args": {
            "where": {
                "Book": {
                    "node": {
                        "title": "Book Title"
                    },
                    "edge": {
                        "words": {
                            "low": 1000,
                            "high": 0
                        }
                    }
                },
                "Journal": {
                    "node": {
                        "subject": "Journal Subject"
                    },
                    "edge": {
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
