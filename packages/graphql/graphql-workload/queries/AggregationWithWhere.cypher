CYPHER 5
MATCH (this:Person)
CALL (this) {
    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
    WITH DISTINCT this1
    RETURN count(this1) = $param0 AS var2
}
WITH *
WHERE var2 = true
RETURN this { .name } AS this