CYPHER 5
MATCH (this:User)
CALL (this) {
    CALL (*) {
        WITH *
        MATCH (this)-[this0:LIKES]->(this1:Person)
        WITH this1 { .name, __resolveType: "Person", __id: id(this1) } AS var2
        RETURN var2
        UNION
        WITH *
        MATCH (this)-[this3:LIKES]->(this4:Movie)
        WITH this4 { .title, __resolveType: "Movie", __id: id(this4) } AS var2
        RETURN var2
    }
    WITH var2
    RETURN collect(var2) AS var2
}
RETURN this { .name, likes: var2 } AS this