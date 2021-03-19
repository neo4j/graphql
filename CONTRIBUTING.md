# Contributing

This is a monrepo.

## Packages

1.
2.

## Getting Started

1. `$ git clone https://github.com/neo4j/graphql.git`
2. `$ cd graphql`
3. `$ yarn`

## FAQ

### Adding a package

Use yarn Workspaces;

```
$ yarn workspace @neo4j/graphql add @graphql-tools/utils
```

### Adding a Dev package

```
$ yarn workspace @neo4j/graphql-ogm add run-s --dev
```

### Removeing a package

```
yarn workspace @neo4j/graphql-ogm add run-s --
```
