CYPHER 5
MATCH (this:Person)
CALL (this) {
    CALL (*) {
        WITH *
        MATCH (this)-[this0:LIKES]->(this1:Person)
        CALL (this1) {
            CALL (*) {
                WITH *
                MATCH (this1)-[this2:LIKES]->(this3:Person)
                WITH this3 { .name, __resolveType: "Person", __id: id(this3) } AS var4
                RETURN var4
                UNION
                WITH *
                MATCH (this1)-[this5:LIKES]->(this6:Movie)
                WITH this6 { .title, __resolveType: "Movie", __id: id(this6) } AS var4
                RETURN var4
            }
            WITH var4
            RETURN collect(var4) AS var4
        }
        WITH this1 { .name, likes: var4, __resolveType: "Person", __id: id(this1) } AS var7
        RETURN var7
        UNION
        WITH *
        MATCH (this)-[this8:LIKES]->(this9:Movie)
        WITH this9 { __resolveType: "Movie", __id: id(this9) } AS var7
        RETURN var7
    }
    WITH var7
    RETURN collect(var7) AS var7
}
RETURN this { .name, likes: var7 } AS this