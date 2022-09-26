# Default Where

In both of the below cases, comparisons can either be static, or against dynamic fields in either context or JWT.

## Append

Defines a filter which will always be applied when querying a type. Extra filters can be defined, which will be applied in an `AND` fashion.

Should work consistently with auth fields, for example `THIS CUSTOM FILTER OR roles CONTAINS "admin"`.



Should this go in `@queryOptions`?




```gql
# Winner winner chicken dinner
@defaultFilter(
    where: {     # UserWhere
        OR: [
            { 
            AND: [
                { id: "$jwt.id" }, 
                { admin: false }
            ] 
            }, 
            { admin: true }
        ]
        }
    }
) {
    id: ID!
    name: String!
    admin: Boolean!
}
```

This leaves space for adding in a top-level `operations` field if it is asked for.


## Default only

Defines the filter which will be applied by default when querying a type. Can be overridden with the specification of any other filter. Could be in GraphQL type defs to assist users?

FUTURE WORK - this is not currently implemented so a new feature.


```gql
# Winner winner chicken dinner
@defaultFilter(
    # Nice argument name for this?
    overridable: true,
    where: {     # UserWhere
        OR: [
            { 
            AND: [
                { id: "$jwt.id" }, 
                { admin: false }
            ] 
            }, 
            { admin: true }
        ]
        }
    }
) {
    id: ID!
    name: String!
    admin: Boolean!
}
```

