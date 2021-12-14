# Redirect Relationship

## Problem

Users should be able to change the target of a relationship from one node to another, maintaining the type and properties of the relationship.

## Proposed Solution

Based on nomenclature in https://neo4j-contrib.github.io/neo4j-apoc-procedures/3.5/graph-refactoring/redirect-relationship/, a new nested operation named `redirect` to be added to update.

This new operation will accept two filter arguments - one to find the existing relationship, and one to find the new target node to connect to.

These filter arguments should only contain unique node properties, much like `connectOrCreate`, to ensure one-to-one redirection.

## Risks



## Out of Scope


