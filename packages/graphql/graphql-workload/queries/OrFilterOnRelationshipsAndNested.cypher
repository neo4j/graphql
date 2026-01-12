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
    MATCH (this)<-[:DIRECTED]-(this3:Person)
    WHERE EXISTS {
        MATCH (this3)-[:ACTED_IN]->(this4:Movie)
        WHERE this4.title = $param3
    }
} OR EXISTS {
    MATCH (this)<-[:DIRECTED]-(this5:Person)
    WHERE EXISTS {
        MATCH (this5)-[:ACTED_IN]->(this6:Movie)
        WHERE this6.title = $param4
    }
} OR EXISTS {
    MATCH (this)<-[:DIRECTED]-(this7:Person)
    WHERE EXISTS {
        MATCH (this7)-[:ACTED_IN]->(this8:Movie)
        WHERE this8.title = $param5
    }
})
CALL (this) {
    MATCH (this)<-[this9:ACTED_IN]-(this10:Person)
    WITH DISTINCT this10
    WITH this10 { .name, .born } AS this10
    RETURN collect(this10) AS var11
}
RETURN this { .title, actors: var11 } AS this