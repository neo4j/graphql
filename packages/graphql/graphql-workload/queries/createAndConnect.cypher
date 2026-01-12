CYPHER 5
CALL {
    CREATE (this0:Movie)
    SET
        this0.id = $param0,
        this0.title = $param1
    WITH *
    CALL (this0) {
        MATCH (this1:Person)
        WHERE this1.name CONTAINS $param2
        CREATE (this0)<-[this2:ACTED_IN]-(this1)
    }
    RETURN this0 AS this
}
WITH this
CALL (this) {
    RETURN this { .title } AS var3
}
RETURN collect(var3) AS data