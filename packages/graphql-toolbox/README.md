# @neo4j/graphql-toolbox

Experiment with your Neo4j GraphQL API.

<p align="center">
  <a href="https://badge.fury.io/js/%40neo4j%2Fgraphql-toolbox">
    <img alt="npm package" src="https://badge.fury.io/js/%40neo4j%2Fgraphql-toolbox.svg">
  </a>
  <a href="https://discord.gg/neo4j">
    <img alt="Discord" src="https://img.shields.io/discord/787399249741479977?logo=discord&logoColor=white">
  </a>
  <a href="https://community.neo4j.com/c/drivers-stacks/graphql/33">
    <img alt="Discourse users" src="https://img.shields.io/discourse/users?logo=discourse&server=https%3A%2F%2Fcommunity.neo4j.com">
  </a>
</p>

1. [Documentation](https://neo4j.com/docs/graphql-manual/current/toolbox/)

![GraphQL Toolbox](https://github.com/neo4j/graphql/blob/dev/docs/modules/ROOT/images/toolbox-editor-view.png)

## Usage

1. Connect to the database with your credentials
2. Define (or Introspect) Typedefs
3. Build Neo4j GraphQL schema
4. Experiment and play

## Devleopment

On the `root` of the project, install the dependencies.

```
yarn
```

then `cd` into the graphql-toolbox package.

```
cd packages/graphql-toolbox
```

Run this command to start the development server. See the output in the console & navigate to the default webpack server at: http://localhost:4242

```
yarn start
```

## GraphQL Toolbox URL parameters

The GraphQL Toolbox supports some URL parameters defined in the query component, see below. These URL parameters are optional and can be provided at convenience.
The query component is preceded by a question mark (?) and contains a query string that is a sequence of key-value pairs separated by an ampersand (&).

| URL parameter | Description                                                                                                                             | Example                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| connectURL    | Form: scheme://username@bolt-url:port; Used at login, pre-populates the Username and Connection URI input field with the provided value | bolt://admin@localhost:7687 |
| db            | Only applicable for multi-database supported Neo4j DBMSs. The provided value is used as the selected database name                      | neo4j                       |

An example with the URL parameters `connectURL` and `db`: `http://localhost:4242?connectURL=bolt%2Bs://xxxx.databases.neo4j.io&db=mydatabase`

Note: The plus symbol (+) in the connectURL (here in `bolt+s`) needs to be URL encoded with `%2B`.

## Licence

[Apache 2.0](https://github.com/neo4j/graphql/blob/master/packages/toolbox/LICENSE.txt)
