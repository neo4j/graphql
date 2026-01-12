CYPHER 5
MATCH (this:Movie)
WHERE EXISTS {
    MATCH (this)<-[:ACTED_IN]-(this0:Person)
    WHERE this0.name = $param0
}
RETURN this { .released } AS this