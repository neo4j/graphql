CYPHER 5
MATCH (this:Movie)
WHERE EXISTS {
    MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
    WHERE (this1.name = $param0 AND NOT (EXISTS {
        MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
        WHERE (this3.title = $param1 AND EXISTS {
            MATCH (this3)<-[this4:DIRECTED]-(this5:Person)
            WHERE this5.name CONTAINS $param2
        })
    }))
}
RETURN this { .title } AS this