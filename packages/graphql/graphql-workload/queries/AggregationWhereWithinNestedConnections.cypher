CYPHER 5
MATCH (this:Person)
CALL (this) {
    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
    CALL (this1, this0) {
        MATCH (this1)<-[this2:ACTED_IN]-(this3:Person)
        CALL (this3) {
            MATCH (this3)-[this4:ACTED_IN]->(this5:Movie)
            RETURN count(this5) > $param0 AS var6
        }
        WITH *
        WHERE var6 = true
        RETURN count(this3) > 0 AS var7
    }
    CALL (this1, this0) {
        MATCH (this1)<-[this2:ACTED_IN]-(this3:Person)
        CALL (this3) {
            MATCH (this3)-[this8:ACTED_IN]->(this9:Movie)
            RETURN count(this9) > $param1 AS var10
        }
        WITH *
        WHERE NOT (var10 = true)
        RETURN count(this3) > 0 AS var11
    }
    WITH *
    WHERE (var11 = false AND var7 = true)
    RETURN count(this1) > 0 AS var12
}
WITH *
WHERE var12 = true
RETURN this { .name } AS this