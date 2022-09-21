# Default Where

In both of the below cases, comparisions can either be static, or against dynamic fields in either context or JWT.

## Append

Defines a filter which will always be applied when querying a type. Extra filters can be defined, which will be applied in an `AND` fashion.

Should work consistently with auth fields, for example `THIS CUSTOM FILTER OR roles CONTAINS "admin"`.

## Default only

Defines the filter which will be applied by default when querying a type. Can be overridden with the specification of any other filter. Could be in GraphQL type defs to assist users?
