CYPHER 5
MATCH (this0:Movie)
WITH collect({ node: this0 }) AS edges
CALL (edges) {
    UNWIND edges AS edge
    WITH edge.node AS this0
    WITH *
    ORDER BY this0.title ASC
    LIMIT $param0
    CALL (this0) {
        MATCH (this0)<-[this1:ACTED_IN]-(this2:Person)
        WITH collect({ node: this2, relationship: this1 }) AS edges
        CALL (edges) {
            UNWIND edges AS edge
            WITH edge.node AS this2, edge.relationship AS this1
            RETURN collect({ node: { name: this2.name, __resolveType: "Person" } }) AS var3
        }
        RETURN { edges: var3 } AS var4
    }
    RETURN collect({ node: { title: this0.title, actorsConnection: var4, __resolveType: "Movie" } }) AS var5
}
RETURN { edges: var5 } AS this