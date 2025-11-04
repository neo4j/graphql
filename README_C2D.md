# @click2deploy/neo4j-graphql - a @neo4j/graphql Fork

This repository is a fork of https://github.com/neo4j/graphql/, specifically [@neo4j/graphql@5.9.2](https://github.com/neo4j/graphql/tree/%40neo4j/graphql%405.9.2/packages/graphql).

This repository is included as a subrepository in the C2D-Repository, therefore the repository structure as been modified to include the GraphQL Library only. Files have been moved from `packages/graphql` to `.` while keeping file history. Merges from `origin` should be possible.

## Repository Structure

### c2d-submodule

The branch `c2d-submodule` contains the library included as submodule in C2D. Changes should happen in separate branches for one consistent change / jira ticket.

See [CHANGELOG_C2D.md](./CHANGELOG_C2D.md) for full changelog.
