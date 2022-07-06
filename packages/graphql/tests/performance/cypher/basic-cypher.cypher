
# Test: FilterOnRelations#187
MATCH (movie:Movie)
WHERE all(whereMovieGenreCond IN [(movie)-[:ACTED_IN]->(whereMovieGenre:Person) | whereMovieGenre.name = "Keanu Reeves"] WHERE whereMovieGenreCond) RETURN movie { .released } AS movie



# Test: BasicTest
MATCH (movie:Movie)
RETURN movie
