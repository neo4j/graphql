CYPHER 5
MATCH (this:Movie)
WHERE (EXISTS {
    MATCH (this)<-[:ACTED_IN]-(this0:Person)
    WHERE this0.born = $param0
} OR EXISTS {
    MATCH (this)<-[:ACTED_IN]-(this1:Person)
    WHERE this1.born = $param1
} OR EXISTS {
    MATCH (this)<-[:ACTED_IN]-(this2:Person)
    WHERE this2.born = $param2
} OR EXISTS {
    MATCH (this)<-[:ACTED_IN]-(this3:Person)
    WHERE this3.born = $param3
} OR EXISTS {
    MATCH (this)<-[:ACTED_IN]-(this4:Person)
    WHERE this4.born = $param4
} OR EXISTS {
    MATCH (this)<-[:ACTED_IN]-(this5:Person)
    WHERE this5.born = $param5
})
CALL (this) {
    MATCH (this)<-[this6:ACTED_IN]-(this7:Person)
    WITH DISTINCT this7
    WITH this7 { .name, .born } AS this7
    RETURN collect(this7) AS var8
}
RETURN this { .title, actors: var8 } AS this