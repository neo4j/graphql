CYPHER 5
CALL db.index.fulltext.queryNodes("MovieTaglineFulltextIndex", $param0) YIELD node AS this0, score AS var1
WHERE $param1 IN labels(this0)
WITH collect({ node: this0, score: var1 }) AS edges
WITH edges, size(edges) AS totalCount
CALL (edges) {
    UNWIND edges AS edge
    WITH edge.node AS this0, edge.score AS var1
    CALL (this0) {
        MATCH (this0)<-[this2:ACTED_IN]-(this3:Person)
        WITH DISTINCT this3
        WITH this3 { .name } AS this3
        RETURN collect(this3) AS var4
    }
    RETURN collect({ node: { title: this0.title, tagline: this0.tagline, actors: var4, __resolveType: "Movie" }, score: var1 }) AS var5
}
RETURN { edges: var5 } AS this