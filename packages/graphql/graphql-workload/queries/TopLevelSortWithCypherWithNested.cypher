CYPHER 5
MATCH (this:Movie)
CALL (this) {
    CALL (this) {
        WITH this AS this
        MATCH (this)<-[:ACTED_IN]-(a:Person) RETURN a.name AS name
    }
    WITH name AS this0
    RETURN this0 AS var1
}
WITH *
ORDER BY var1 DESC
LIMIT $param0
CALL (this) {
    MATCH (this)<-[this2:ACTED_IN]-(this3:Person)
    WITH DISTINCT this3
    WITH this3 { .name } AS this3
    RETURN collect(this3) AS var4
}
RETURN this { .title, oneActorName: var1, actors: var4 } AS this