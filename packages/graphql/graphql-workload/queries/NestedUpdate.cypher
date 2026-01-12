CYPHER 5
MATCH (this:Movie)
WITH *
WHERE this.title STARTS WITH $param0
WITH *
CALL (*) {
    MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
    WITH *
    WHERE this1.name STARTS WITH $param1
    SET
        this1.name = $param2
}
WITH this
RETURN this { .title } AS this