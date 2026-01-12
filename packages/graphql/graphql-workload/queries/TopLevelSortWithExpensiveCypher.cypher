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
CALL (this) {
    CALL (this) {
        WITH this AS this
        MATCH (this)<-[:ACTED_IN]-(a:Person)-[:ACTED_IN]->(m:Movie)
        WITH m
        ORDER BY m.title DESC
        RETURN distinct (m) as otherMovies
    }
    WITH otherMovies AS this2
    WITH this2 { .title } AS this2
    RETURN collect(this2) AS var3
}
WITH *
ORDER BY var1 DESC
LIMIT $param0
RETURN this { .title, oneActorName: var1, otherMoviesWhereActorsActedIn: var3 } AS this