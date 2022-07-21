# Optional features

## Problem

A Neo4j GraphQL library design introduced is to add operators directly in the schema for the supported fields.
The number of operators and other features grows and with them the size of the `augmented schema`.
A solution to reduce the size of the problem is to introduce the possibility to configure the environment with only the features necessary.

## Proposed Solution (Config)

The Config solution is to add to the `Neo4jGraphQL` constructor the argument features which could be used to enable, disable and configure specific features.

### Usage Examples

```javascript
  const neoSchema = new Neo4jGraphQL({
        config: {
            enableDebug: true,
        },
        features: {
            filters: {
                String: {
                    GT: true,
                    LT: false,
                }
            }
        },
        typeDefs,
        driver,
        plugins: {
            auth: new Neo4jGraphQLAuthJWTPlugin({
                secret: "1234",
                noVerify: true,
            }),
        },
    });
```

When the behavior is not explicitly defined then the default behavior is applied.

### Technical considerations

#### Library complexity

The proposed solution could increase the complexity of the library, with more cases to test and more details needed to help library users.

## Discarded Solution (Import/Plugin)

One solution could be for not core features to be implemented outside the core library and dynamically add them in the javascript runtime.

### Usage Examples

```javascript
const neoSchema = new Neo4jGraphQL({
    config: {
        enableDebug: true,
    },
    typeDefs,
    driver,
    plugins: {
        auth: new Neo4jGraphQLAuthJWTPlugin({
            secret: "1234",
            noVerify: true,
        }),
        stringComparator: new Neo4jStringComparator({ ...settings }),
    },
});
```

### Technical considerations

#### Internal interfaces/ Designs

Some parts of the codebase could be not designed to be extended.

## Risks

-   Library complexity.

### Security consideration

-   External developed plugin could lead to security concerns
