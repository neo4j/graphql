CYPHER 5
MATCH (this0:Movie)
WITH count(this0) AS totalCount
RETURN { totalCount: totalCount } AS this