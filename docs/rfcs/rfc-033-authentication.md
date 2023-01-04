# Authentication

## Problem

Authentication is currently bundled into the `@auth` directive, alongside authorization. Some users will just want to protect particular types with authentication only, and we should make this as simple as possible. Currently, authentication is checked during Cypher execution, which poses a security threat because unauthenticated users will be able to have Cypher executed in the database.

## Solution

Introduce a directive purely for the purposes of authentication:

```gql
directive @authentication(
  enabled: Boolean! = true
  operations: [Operation!]! = [READ, CREATE, UPDATE, DELETE]
) on OBJECT | FIELD_DEFINITION | SCHEMA | INTERFACE
```

### Interfaces

TODO Is overriding directives in objects implementing the interface the right behaviour? Should we instead append? If we switch to append, override becomes impossible. With the current override behaviour, append is possible via copying the directive from the interface.
