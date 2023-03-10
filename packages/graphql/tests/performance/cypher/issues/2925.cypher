# Test: SingleRelationshipFilter
MATCH (m:Movie)-[:FAV]->(p:Person) 
WHERE p.name in ["Tom Hanks"] 
RETURN m { .title }

# Test: SingleRelationshipFilterWithCount
MATCH (this:`Movie`)
CALL {
    WITH this
    MATCH (this)-[:FAV]->(this0:`Person`)
    WHERE this0.name IN ["Tom Hanks"]
    RETURN this as this2, count(this0) AS favCount
}
WITH this2 as this, favCount
WHERE favCount = 1
RETURN this { .title } AS this

# Test: SingleRelationshipFilterWithSubqueryAndLimit
MATCH (this:`Movie`)
CALL {
    WITH this
    MATCH (this)-[:FAV]->(this0:`Person`)
    WHERE this0.name IN ["Tom Hanks"]
    RETURN this0
    LIMIT 1
}
WITH this, count(this0) as favCount
WHERE favCount = 1
RETURN this { .title } AS this

# Test: SingleRelationshipFilterWithOptionalMatch
MATCH (this:`Movie`)
OPTIONAL MATCH (this)-[:FAV]->(this0:`Person`)
WHERE this0.name IN ["Tom Hanks"]
WITH this, count(this0) AS favCount
WHERE favCount = 1
RETURN this { .title } AS this
