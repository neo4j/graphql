CYPHER 5
MATCH (this:Person)
CALL (this) {
    MATCH (this)-[:ACTED_IN]->(this0:Movie)
    CALL (this0) {
        MATCH (this0)<-[:ACTED_IN]-(this1:Person)
        CALL (this1) {
            MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
            RETURN count(this3) > $param0 AS var4
        }
        WITH *
        WHERE var4 = true
        RETURN count(this1) > 0 AS var5
    }
    CALL (this0) {
        MATCH (this0)<-[:ACTED_IN]-(this1:Person)
        CALL (this1) {
            MATCH (this1)-[this6:ACTED_IN]->(this7:Movie)
            RETURN count(this7) > $param1 AS var8
        }
        WITH *
        WHERE NOT (var8 = true)
        RETURN count(this1) > 0 AS var9
    }
    WITH *
    WHERE (var9 = false AND var5 = true)
    RETURN count(this0) > 0 AS var10
}
WITH *
WHERE var10 = true
RETURN this { .name } AS this