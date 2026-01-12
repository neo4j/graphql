CYPHER 5
MATCH (this:Movie)
CALL (this) {
    MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
    WITH collect({ node: this1, relationship: this0 }) AS edges
    CALL (edges) {
        UNWIND edges AS edge
        WITH edge.node AS this1, edge.relationship AS this0
        RETURN collect({ node: { name: this1.name, __resolveType: "Person" } }) AS var2
    }
    RETURN { edges: var2 } AS var3
}
RETURN this { actorsConnection: var3 } AS this