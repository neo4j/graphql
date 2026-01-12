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
    RETURN collect({ node: { title: this0.title, oneActorName: var2, __resolveType: "Movie" } }) AS var3
}
RETURN { edges: var3 } AS this