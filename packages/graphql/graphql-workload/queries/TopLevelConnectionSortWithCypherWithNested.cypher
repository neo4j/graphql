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
        MATCH (this0)<-[this3:ACTED_IN]-(this4:Person)
        WITH collect({ node: this4, relationship: this3 }) AS edges
        CALL (edges) {
            UNWIND edges AS edge
            WITH edge.node AS this4, edge.relationship AS this3
            RETURN collect({ node: { name: this4.name, __resolveType: "Person" } }) AS var5
        }
        RETURN { edges: var5 } AS var6
    }
    RETURN collect({ node: { title: this0.title, oneActorName: var2, actorsConnection: var6, __resolveType: "Movie" } }) AS var7
}
RETURN { edges: var7 } AS this