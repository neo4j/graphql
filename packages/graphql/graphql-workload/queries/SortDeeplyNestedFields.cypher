CYPHER 5
MATCH (this:Movie)
CALL (this) {
    MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
    WITH DISTINCT this1
    CALL (this1) {
        MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
        WITH DISTINCT this3
        WITH this3 { .released } AS this3
        ORDER BY this3.released DESC
        RETURN collect(this3) AS var4
    }
    WITH this1 { .name, movies: var4 } AS this1
    ORDER BY this1.name ASC
    RETURN collect(this1) AS var5
}
RETURN this { .title, actors: var5 } AS this