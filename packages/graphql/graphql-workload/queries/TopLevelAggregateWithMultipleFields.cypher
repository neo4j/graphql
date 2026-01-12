CYPHER 5
CALL {
    MATCH (this:Person)
    RETURN { nodes: count(DISTINCT this) } AS var0
}
CALL {
    MATCH (this:Person)
    WITH DISTINCT this
    ORDER BY size(this.name) DESC
    WITH collect(this.name) AS list
    RETURN { shortest: last(list) } AS var1
}
CALL {
    MATCH (this:Person)
    WITH DISTINCT this
    RETURN { max: max(this.born) } AS var2
}
RETURN { aggregate: { count: var0, node: { name: var1, born: var2 } } } AS this