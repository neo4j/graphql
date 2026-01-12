CYPHER 5
MATCH (this:Person)
CALL (this) {
    CALL (this) {
        MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
        WITH DISTINCT this1
        ORDER BY size(this1.title) DESC
        WITH collect(this1.title) AS list
        RETURN { longest: head(list) } AS var2
    }
    RETURN { aggregate: { node: { title: var2 } } } AS var3
}
RETURN this { .name, moviesConnection: var3 } AS this