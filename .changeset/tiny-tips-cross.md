---
"@neo4j/graphql": patch
---

Allow enabling/disabling of connection query fields on type by type basis as well as for the whole schema via a new `@query` directive argument `connection`. Default value of `connection` is the same as `read`, inheriting its default value of `true` if not provided.

Examples:

- read: false -> only write operations generated
- read: true -> all read operations generated, no aggregate field
- read: false, connection: true -> only connection operation generated, no aggregate field
- read: false, connection: true, aggregate: true -> only connection operation generated, with both edges and aggregate fields
- connection: false, aggregate: true -> simple read generated, connection field generated with only aggregate field
- read: false, aggregate: true -> connection field generated with aggregate field only
- read: false, connection: true -> connection field generated with edges field only
- aggregate: false, connection: false -> only simple read generated
- read: true, connection: false -> only simple read field generated, connection field not generated
