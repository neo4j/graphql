# Test: MatchNestedWithoutSubquery
MATCH (this:`Movie`)
MATCH (this_actors:`Person`)-[this0:ACTED_IN]->(this)
MATCH (this_actors)-[this1:ACTED_IN]->(this_actors_movies:`Movie`)
MATCH (this_actors_movies_actors:`Person`)-[this2:ACTED_IN]->(this_actors_movies)

WITH collect(this_actors_movies_actors { .name }) AS this_actors_movies_actors, this_actors_movies, this_actors, this
WITH collect(this_actors_movies { .title, actors: this_actors_movies_actors }) AS this_actors_movies, this_actors, this
WITH collect(this_actors { .name, movies: this_actors_movies }) AS this_actors, this

RETURN this { actors: this_actors } AS this

# Test: MatchNestedWithoutSubqueryInSingleMatch
MATCH (this:`Movie`),
(this_actors:`Person`)-[this0:ACTED_IN]->(this),
(this_actors)-[this1:ACTED_IN]->(this_actors_movies:`Movie`),
(this_actors_movies_actors:`Person`)-[this2:ACTED_IN]->(this_actors_movies)

WITH collect(this_actors_movies_actors { .name }) AS this_actors_movies_actors, this_actors_movies, this_actors, this
WITH collect(this_actors_movies { .title, actors: this_actors_movies_actors }) AS this_actors_movies, this_actors, this
WITH collect(this_actors { .name, movies: this_actors_movies }) AS this_actors, this

RETURN this { actors: this_actors } AS this


# Test: MatchNestedWithoutSubqueryAndSingleMatchPattern
MATCH(this:`Movie`)<-[this0:ACTED_IN]-(this_actors:`Person`)-[this1:ACTED_IN]->(this_actors_movies:`Movie`)<-[this2:ACTED_IN]-(this_actors_movies_actors:`Person`)
WITH collect(this_actors_movies_actors { .name }) AS this_actors_movies_actors, this_actors_movies, this_actors, this
WITH collect(this_actors_movies { .title, actors: this_actors_movies_actors }) AS this_actors_movies, this_actors, this
WITH collect(this_actors { .name, movies: this_actors_movies }) AS this_actors, this

RETURN this { actors: this_actors } AS this

# Test: MatchNestedWithFilterWithoutSubqueryAndSingleMatchPattern
MATCH(this:`Movie`)<-[this0:ACTED_IN]-(this_actors:`Person`)-[this1:ACTED_IN]->(this_actors_movies:`Movie`)<-[this2:ACTED_IN]-(this_actors_movies_actors:`Person`)
WHERE this_actors_movies.title CONTAINS "Shark"
WHERE this_actors.born > 1000
WITH collect(this_actors_movies_actors { .name }) AS this_actors_movies_actors, this_actors_movies, this_actors, this
WITH collect(this_actors_movies { .title, actors: this_actors_movies_actors }) AS this_actors_movies, this_actors, this
WITH collect(this_actors { .name, movies: this_actors_movies }) AS this_actors, this

RETURN this { actors: this_actors } AS this
