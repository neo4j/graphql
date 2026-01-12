CYPHER 5
MATCH (this0:Movie)
WITH collect({ node: this0 }) AS edges
CALL (edges) {
    UNWIND edges AS edge
    WITH edge.node AS this0
    CALL (this0) {
        CALL (this0) {
            WITH this0 AS this
            MATCH (this)<-[:ACTED_IN]-(a:Person) RETURN a.name AS name
        }
        WITH name AS this1
        RETURN this1 AS var2
    }
    WITH *
    ORDER BY var2 DESC
    LIMIT $param0
    CALL (this0) {
        CALL (this0) {
            WITH this0 AS this
            MATCH (this)<-[:ACTED_IN]-(a:Person)-[:ACTED_IN]->(m:Movie)
            WITH m
            ORDER BY m.title DESC
            RETURN distinct (m) as otherMovies
        }
        WITH otherMovies AS this3
        WITH this3 { .title } AS this3
        RETURN collect(this3) AS var4
    }
    RETURN collect({ node: { title: this0.title, oneActorName: var2, otherMoviesWhereActorsActedIn: var4, __resolveType: "Movie" } }) AS var5
}
RETURN { edges: var5 } AS this