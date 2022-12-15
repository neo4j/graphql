# Test: FieldCountWithCall
MATCH (this:`Movie`)
CALL {
    WITH this
    MATCH (p:Person)-[:ACTED_IN]->(this)
    RETURN count(p) as count
}
RETURN this { actorsAggregate: { count: count } } as this

# Test: FieldCountWithPlainMatches
MATCH (this:`Movie`)
MATCH (p:Person)-[:ACTED_IN]->(this)
WITH this, count(p) as count
RETURN this { actorsAggregate: { count: count } } as this

# Test: FieldCountWithSingleMatchPattern
MATCH (p:Person)-[:ACTED_IN]->(this:`Movie`)
WITH this, count(p) as count
RETURN this { actorsAggregate: { count: count } } as this

# Test: FieldCountWithSize
MATCH (this:`Movie`)
RETURN this { actorsAggregate: { count: size([(this_actorsAggregate_this0:`Person`)-[this_actorsAggregate_this1:ACTED_IN]->(this) | this_actorsAggregate_this0]) } } as this
