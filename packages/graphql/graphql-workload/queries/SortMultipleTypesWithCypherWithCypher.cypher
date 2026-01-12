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
ORDER BY var1 ASC
LIMIT $param0
CALL (this) {
    MATCH (this)<-[this2:ACTED_IN]-(this3:Person)
    WITH collect({ node: this3, relationship: this2 }) AS edges
    CALL (edges) {
        UNWIND edges AS edge
        WITH edge.node AS this3, edge.relationship AS this2
        RETURN collect({ node: { name: this3.name, __resolveType: "Person" } }) AS var4
    }
    RETURN { edges: var4 } AS var5
}
CALL (this) {
    MATCH (this)<-[this6:DIRECTED]-(this7:Person)
    WITH collect({ node: this7, relationship: this6 }) AS edges
    CALL (edges) {
        UNWIND edges AS edge
        WITH edge.node AS this7, edge.relationship AS this6
        RETURN collect({ node: { name: this7.name, __resolveType: "Person" } }) AS var8
    }
    RETURN { edges: var8 } AS var9
}
RETURN this { .title, actorsConnection: var5, directorsConnection: var9, oneActorName: var1 } AS this