CYPHER 5
CALL {
    MATCH (user:Person { name_INCLUDES: "Wa" })
    RETURN user
}
WITH user AS this0
WITH this0 { .name } AS this0
RETURN this0 AS this