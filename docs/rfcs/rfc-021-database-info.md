# Database info

## Problem
Providing compatibility with multiple Neo4j versions comes with some difficulty; Different Neo4j versions require different approaches to obtain the same result optimally. Without knowing where the query will be executed during the query generation, it's not possible to change the query accordingly.
As a use case, let's consider the following example:
```cypher
RETURN distance(point({x:10, y:5}), point({x:10, y:10}))
```
Which produces `5.0` using `Neo4j 4.x`, it will result in an error if used against a `Neo4j 5.x` instance.
The same query could be written as:
```cypher
RETURN point.distance(point({x:10, y:5}), point({x:10, y:10}))
```
Which is able to being executed against a `Neo4j 5.x` instance.

## Proposed Solution
From version `Neo4j 3.5` it is available the procedure `dbms.components` which can be used as:
```cypher
call dbms.components() yield name, versions, edition unwind versions as version return name, version, edition;
```
to obtain the following:

|  name            |  version         |  edition         |
|  --------------  |  --------------  |  --------------  |
|  "Neo4j Kernel"  |  "4.4.5"         |  "enterprise"    |

with this information in hand it's possible to store it in the GraphQL Context avoiding a roundtrip for every execution.

### Usage Examples

### Technical considerations

#### Thing

## Risks

### Security consideration
None.

## Out of Scope
