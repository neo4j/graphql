
# Test: FilterOnRelations#187
MATCH (movie:Movie)
WHERE all(whereMovieGenreCond IN [(movie)-[:ACTED_IN]->(whereMovieGenre:Person) | whereMovieGenre.name = "Keanu Reeves"] WHERE whereMovieGenreCond) RETURN movie { .released } AS movie



# Test: BasicTest
MATCH (movie:Movie)
RETURN movie

# Test: MatchSubquery
MATCH(this:Movie)
CALL {
    WITH this
    MATCH (this)<-[:ACTED_IN]-(p:Person)
    RETURN collect( p {.name }) as this_actor
}
RETURN this {.title, actor: this_actor} AS this


# Test: MatchInline
MATCH(this:Movie)
MATCH(this)<-[:ACTED_IN]-(a:Person)
WITH this, collect(a {.name}) as actors
RETURN this {.title, actors: actors}
