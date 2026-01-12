CYPHER 5
MATCH (this:Movie)
CALL (this) {
    MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
    WITH collect({ node: this1, relationship: this0 }) AS edges
    CALL (edges) {
        UNWIND edges AS edge
        WITH edge.node AS this1, edge.relationship AS this0
        CALL (this1) {
            MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
            WITH collect({ node: this3, relationship: this2 }) AS edges
            CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this3, edge.relationship AS this2
                RETURN collect({ node: { title: this3.title, __resolveType: "Movie" } }) AS var4
            }
            RETURN { edges: var4 } AS var5
        }
        RETURN collect({ node: { name: this1.name, moviesConnection: var5, __resolveType: "Person" } }) AS var6
    }
    RETURN { edges: var6 } AS var7
}
RETURN this { actorsConnection: var7 } AS this