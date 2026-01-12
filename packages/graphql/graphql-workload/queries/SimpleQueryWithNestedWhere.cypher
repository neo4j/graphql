CYPHER 5
MATCH (this:Movie)
WHERE EXISTS {
    MATCH (this)<-[:ACTED_IN]-(this0:Person)
    WHERE this0.name = $param0
}
CALL (this) {
    MATCH (this)<-[this1:ACTED_IN]-(this2:Person)
    WITH DISTINCT this2
    WITH this2 { .name } AS this2
    RETURN collect(this2) AS var3
}
RETURN this { .title, actors: var3 } AS this