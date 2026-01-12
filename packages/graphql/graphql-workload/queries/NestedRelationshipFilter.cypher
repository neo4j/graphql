CYPHER 5
MATCH (this:Movie)
WHERE EXISTS {
    MATCH (this)<-[:ACTED_IN]-(this0:Person)
    WHERE EXISTS {
        MATCH (this0)-[:ACTED_IN]->(this1:Movie)
        WHERE this1.title = $param0
    }
}
RETURN this { .title } AS this