# Aggregation Query Filters

## Problem

Given the following type definition:

```graphql
type Group {
    name: String!
    posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
}

type Post {
    title: String!
    released: Int
    author: Person @relationship(type: "WROTE_POST", direction: IN)
}

type Person {
    name: String!
    role: String!
    posts: [Post!]! @relationship(type: "WROTE_POST", direction: OUT)
}
```

Is currently possible to query all the groups that contain less than 10 `Post`, using a query like:

```graphql
query {
  groups(where: {
    postsAggregate: {
      count_LT: 10
    }
  }) {
    name
  }
}
```

**Cypher**

```cypher
MATCH (this:`Group`)
CALL {
    WITH this
    MATCH (this:`Group`)-[this0:HAS_POST]->(this1:`Post`)
    RETURN count(this1) < 10 AS var2
}
WITH *
WHERE var2 = true
RETURN this { .name } AS this
```

Although, is not possible to query all the groups that contain less than 10 `Posts` written in 2022.
This is not possible because there is no such mechanism implemented that allows the user to modify the aggregation query.

The Cypher required to achieve the above looks like this:

**Cypher**
```cypher
MATCH (this:`Group`)
CALL {
    WITH this
    MATCH (this:`Group`)-[this0:HAS_POST]->(this1:`Post`)
    WHERE this1.released = 2022
    RETURN count(this1) < 10 AS var2
}
WITH *
WHERE var2 = true
RETURN this { .name } AS this
```

## Proposed Solution

This RFC propose to introduce the type: `{type}{relationField}AggregateFilter` and the `{type}WhereNoNested` as follow:

```graphql
input PostWhereNoNested {
  OR: [PostWhereNoNested!]
  AND: [PostWhereNoNested!]
  title: String
  title_NOT: String
  title_IN: [String!]
  title_NOT_IN: [String!]
  title_CONTAINS: String
  title_NOT_CONTAINS: String
  title_STARTS_WITH: String
  title_NOT_STARTS_WITH: String
  title_ENDS_WITH: String
  title_NOT_ENDS_WITH: String
  released: Int
  released_NOT: Int
  released_IN: [Int]
  released_NOT_IN: [Int]
  released_LT: Int
  released_LTE: Int
  released_GT: Int
  released_GTE: Int
}

input GroupPostsAggregateFilter {
    queryWhere: PostWhereNoNested ## This filter is applied only to the aggregation query
    aggregationWhere: GroupPostsAggregateInput
}

input GroupPostsAggregateInput {
  AND: [GroupPostsAggregateInput!]
  OR: [GroupPostsAggregateInput!]
  count: Int
  count_LT: Int
  count_LTE: Int
  count_GT: Int
  count_GTE: Int
  node: GroupPostsNodeAggregationWhereInput
}
```

To reduce the complexity of the implementation the `{type}Where` type is not being reused during the aggregation filter, as it would have allowed nested filters and/or aggregation query filtered by a nested aggregation query.

### Usage Examples

Using the new Type Definition is possible to achieve the following:

**groups that contain less than 10 `Post` written in 2022**

```graphql
query {
  groups(where: {
    postsAggregate: {
      queryWhere: {
        released: 2022
      }
      aggregationWhere: {
        count_LT: 10
      }
    }
  }) {
    name
  }
}
```

**Cypher**
```cypher
MATCH (this:`Group`)
CALL {
    WITH this
    MATCH (this:`Group`)-[this0:HAS_POST]->(this1:`Post`)
    WHERE this1.released = 2022
    RETURN count(this1) < $param0 AS var2
}
WITH *
WHERE var2 = true
RETURN this { .name } AS this
```

**groups that contain less than 10 `Post` written in 2022 or 2020**

```graphql
query {
  groups(where: {
    postsAggregate: {
      queryWhere: {
        OR: [
            {
                released: 2022
            },
            {
                released: 2020
            },
        ]
      }
      aggregationWhere: {
        count_LT: 10
      }
    }
  }) {
    name
  }
}
```

**Cypher**
```cypher
MATCH (this:`Group`)
CALL {
    WITH this
    MATCH (this:`Group`)-[this0:HAS_POST]->(this1:`Post`)
    WHERE this1.released = 2022 OR this1.released = 2020
    RETURN count(this1) < $param0 AS var2
}
WITH *
WHERE var2 = true
RETURN this { .name } AS this
```

**groups that contain less than 10 `Post` written in 2022 or 2020, or with a title that is longer than 10 characters**

```graphql
query {
  groups(where: {
    postsAggregate: {
      queryWhere: {
        OR: [
            {
                released: 2022
            },
            {
                released: 2020
            },
        ]
      }
      aggregationWhere: {
        OR: 
        [
            {
                count_LT: 10
            },
            {
                count_LT: 10
            },
        ]
        
      }
    }
  }) {
    name
  }
}
```

**Cypher**
```cypher
MATCH (this:`Group`)
CALL {
    WITH this
    MATCH (this:`Group`)-[this0:HAS_POST]->(this1:`Post`)
    WHERE this1.released = 2022 OR this1.released = 2020
    RETURN count(this1) < 10 AS var2, max(size(this1.title)) > 10 AS var3
}
WITH *
WHERE (var2 = true AND var3 = true)
RETURN this { .name } AS this
```

## Risks

- Schema size increase.
- Even if there is a reason for this filters, the usage of these filters could be confusing.

### Security consideration

- None

## Out of Scope

- Nested filters.