CYPHER 5
MATCH (this:Movie)
WITH *
WITH *
CALL (*) {
    OPTIONAL MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
    WHERE this1.name CONTAINS $param0
    WITH this0, collect(DISTINCT this1) AS var2
    CALL (var2) {
        UNWIND var2 AS var3
        DETACH DELETE var3
    }
}
WITH this
RETURN this { .title } AS this