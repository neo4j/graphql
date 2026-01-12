CYPHER 5
MATCH (this:Movie)
WHERE (this.title = $param0 OR this.title = $param1)
CALL (this) {
    MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
    WITH DISTINCT this1
    CALL (this1) {
        MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
        WITH DISTINCT this3
        CALL (this3) {
            MATCH (this3)<-[this4:ACTED_IN]-(this5:Person)
            WITH DISTINCT this5
            WITH this5 { .name } AS this5
            RETURN collect(this5) AS var6
        }
        WITH this3 { .title, actors: var6 } AS this3
        RETURN collect(this3) AS var7
    }
    WITH this1 { .name, movies: var7 } AS this1
    RETURN collect(this1) AS var8
}
RETURN this { actors: var8 } AS this