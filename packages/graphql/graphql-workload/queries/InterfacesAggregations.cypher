CYPHER 5
CALL () {
    CALL () {
        MATCH (this0:Movie)
        WITH { node: { __resolveType: "Movie", __id: id(this0) } } AS edge
        RETURN edge
        UNION
        MATCH (this1:MovieClone)
        WITH { node: { __resolveType: "MovieClone", __id: id(this1) } } AS edge
        RETURN edge
    }
    RETURN collect(edge) AS edges
}
CALL () {
    CALL {
        MATCH (this2:Movie)
        RETURN this2 AS node
        UNION
        MATCH (this3:MovieClone)
        RETURN this3 AS node
    }
    WITH DISTINCT node
    ORDER BY size(node.title) DESC
    WITH collect(node.title) AS list
    RETURN { longest: head(list), shortest: last(list) } AS this4
}
WITH edges, { node: { title: this4 } } AS var5
WITH edges, size(edges) AS totalCount, var5
RETURN { edges: edges, totalCount: totalCount, aggregate: var5 } AS this