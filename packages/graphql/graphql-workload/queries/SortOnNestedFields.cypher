CYPHER 5
MATCH (this:Movie)
CALL (this) {
    MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
    WITH DISTINCT this1
    WITH this1 { .name } AS this1
    ORDER BY this1.name ASC
    RETURN collect(this1) AS var2
}
RETURN this { actors: var2 } AS this