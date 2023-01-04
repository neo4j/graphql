# Default where

## Problem

## Solution

The introduction of a new directive for applying a base filter.

```gql
enum dfijidf {
  AND
  OR
  OVERRIDE
  MERGE
}

directive @where(
  behavior: dfijidf! = AND
  operations: [Operation!]! = [READ, CREATE, UPDATE, DELETE]
  filter: Where
) on OBJECT | FIELD_DEFINITION | SCHEMA | INTERFACE
```
