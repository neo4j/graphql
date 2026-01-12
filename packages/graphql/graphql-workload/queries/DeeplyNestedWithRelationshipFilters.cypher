CYPHER 5
MATCH (this:Person)
WHERE (this.name STARTS WITH $param0 AND EXISTS {
    MATCH (this)-[:ACTED_IN]->(this0:Movie)
    WHERE (this0.title CONTAINS $param1 AND EXISTS {
        MATCH (this0)<-[:ACTED_IN]-(this1:Person)
        WHERE (this1.name CONTAINS $param2 AND EXISTS {
            MATCH (this1)-[:ACTED_IN]->(this2:Movie)
            WHERE (NOT (this2.title = $param3) AND EXISTS {
                MATCH (this2)<-[:ACTED_IN]-(this3:Person)
                WHERE (this3.name CONTAINS $param4 AND NOT (EXISTS {
                    MATCH (this3)-[:ACTED_IN]->(this4:Movie)
                    WHERE this4.title = $param5
                }))
            })
        })
    })
})
RETURN this { .name } AS this