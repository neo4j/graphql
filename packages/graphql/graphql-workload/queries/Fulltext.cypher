CYPHER 5
CALL db.index.fulltext.queryNodes("MovieTaglineFulltextIndex", $param0) YIELD node AS this0, score AS var1
WHERE $param1 IN labels(this0)
WITH collect({ node: this0, score: var1 }) AS edges
WITH edges, size(edges) AS totalCount
CALL (edges) {
    UNWIND edges AS edge
    WITH edge.node AS this0, edge.score AS var1
    RETURN collect({ node: { title: this0.title, tagline: this0.tagline, __resolveType: "Movie" }, score: var1 }) AS var2
}
RETURN { edges: var2 } AS this