CYPHER 5
MATCH (this:Movie)
CALL (this) {
    MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
    WITH DISTINCT this1
    WITH this1 { .name } AS this1
    RETURN collect(this1) AS var2
}
RETURN this { .title, actors: var2 } AS this