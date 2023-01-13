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

![Neo4j GraphQL Toolbox](https://github.com/neo4j/graphql/blob/dev/docs/modules/ROOT/images/toolbox-editor-view.png)

## Link

Access the Neo4j GraphQL Toolbox here: https://graphql-toolbox.neo4j.io/

## Usage

1. Connect to the database with your credentials
2. Define (or Introspect) the Type definitions
3. Build Neo4j GraphQL schema
4. Experiment, query and play

## Development

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

The GraphQL Toolbox supports some URL parameters defined in the query string, see below. These URL parameters are optional and can be provided for convenience.
The query string is preceded by a question mark (?) and contains key-value pairs separated by an ampersand (&).

| URL parameter | Description                                                                                                                                                                 | Example                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| connectURL    | Form: scheme://username:password@bolt-url:port; Used at login, pre-populates the Username, if provided the password, and Connection URI input field with the provided value | bolt://admin@localhost:7687 |
| db            | Only applicable for multi-database supported Neo4j DBMSs. The provided value is used as the selected database name. This will be applied _after_ login                      | neo4j                       |

An example with the URL parameters `connectURL` and `db`:

`http://localhost:4242?connectURL=bolt%2Bs://testuser@xxxx.databases.neo4j.io&db=mydatabase`

This will pre-fill the login window input fields `Username` with `testuser` and `Connect URI` with `bolt+s://xxxx.databases.neo4j.io`. After a successful login, the selected database will be set according to the provided `db` parameter.

Note: The plus symbol (+) in the connectURL needs to be URL encoded to become `%2B`. For example `bolt+s` becomes `bolt%2Bs`.

The `connectURL` URL parameter can additionally be used to provide the database password, see form above in table.

> IMPORTANT: Please use the `connectURL` URL parameter with the password value only for _temporary_ or _test_ databases! Never for production databases or databases that contain valuable or sensitive information!

If the `connectURL` URL parameter including the password is provided, one auto login attempt is started on load of the application.

## License

[Apache 2.0](https://github.com/neo4j/graphql/blob/master/packages/toolbox/LICENSE.txt)
