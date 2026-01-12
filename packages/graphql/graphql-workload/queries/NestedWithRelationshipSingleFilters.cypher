CYPHER 5
MATCH (this:Person)
WHERE (this.name STARTS WITH $param0 AND single(this0 IN [(this)-[:ACTED_IN]->(this0:Movie) WHERE (this0.title CONTAINS $param1 AND single(this1 IN [(this0)<-[:ACTED_IN]-(this1:Person) WHERE this1.name CONTAINS $param2 | 1] WHERE true)) | 1] WHERE true))
RETURN this { .name } AS this