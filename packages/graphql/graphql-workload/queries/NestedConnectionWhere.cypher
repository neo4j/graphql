CYPHER 5
MATCH (this:Movie)
WHERE EXISTS {
    MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
    WHERE (this1.name = $param0 AND NOT (EXISTS {
        MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
        WHERE this3.title = $param1
    }))
}
RETURN this { .title } AS this