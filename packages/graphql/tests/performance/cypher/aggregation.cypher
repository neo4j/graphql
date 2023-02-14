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

# Test: CurrentAggregationsWithinNestedRelationships
MATCH (this:`Person`)
CALL {
    WITH this
    MATCH (this)-[:ACTED_IN]->(this0:`Movie`)
    CALL {
        WITH this0
        MATCH (this1:`Person`)-[:ACTED_IN]->(this0)
        CALL {
            WITH this1
            MATCH (this1)-[this2:ACTED_IN]->(this3:`Movie`)
            RETURN count(this3) > 1 AS var4
        }
        WITH *
        WHERE var4 = true
        RETURN count(this1) > 0 AS var5
    }
    CALL {
        WITH this0
        MATCH (this1:`Person`)-[:ACTED_IN]->(this0)
        CALL {
            WITH this1
            MATCH (this1)-[this6:ACTED_IN]->(this7:`Movie`)
            RETURN count(this7) > 1 AS var8
        }
        WITH *
        WHERE NOT (var8 = true)
        RETURN count(this1) > 0 AS var9
    }
    WITH *
    WHERE (var9 = false AND var5 = true)
    RETURN count(this0) > 0 AS var10
}
WITH *
WHERE var10 = true
RETURN this { .name } AS this

# Test: AlternativeAggregationsWithinNestedRelationships
MATCH (this:`Person`)
WHERE EXISTS {
    MATCH (this)-[:ACTED_IN]->(this0:`Movie`)
    WHERE EXISTS {
        MATCH (this1:`Person`)-[:ACTED_IN]->(this0)
        CALL {
            WITH this1
            MATCH (this1)-[this2:ACTED_IN]->(this3:`Movie`)
            RETURN count(this3) > 1 AS var4
        }
        WITH *
        WHERE var4 = true
    } AND NOT EXISTS {
        MATCH (this1:`Person`)-[:ACTED_IN]->(this0)
        CALL {
            WITH this1
            MATCH (this1)-[this2:ACTED_IN]->(this3:`Movie`)
            RETURN count(this3) > 1 AS var4
        }
        WITH *
        WHERE NOT (var4 = true)
    }
}
RETURN this { .name } AS this
