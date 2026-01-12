CYPHER 5
MATCH (this:Movie)
WITH *
ORDER BY this.title ASC
LIMIT $param0
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
CALL (this) {
    MATCH (this)<-[this4:DIRECTED]-(this5:Person)
    WITH collect({ node: this5, relationship: this4 }) AS edges
    CALL (edges) {
        UNWIND edges AS edge
        WITH edge.node AS this5, edge.relationship AS this4
        RETURN collect({ node: { name: this5.name, __resolveType: "Person" } }) AS var6
    }
    RETURN { edges: var6 } AS var7
}
RETURN this { .title, actorsConnection: var3, directorsConnection: var7 } AS this