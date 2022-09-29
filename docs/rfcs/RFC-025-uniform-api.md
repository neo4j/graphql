# UNIFORM API

## Problem

At this moment there is inconsistency between the Connection API and the standard API.

```graphql
query Actors {
  actors(options: {
    sort: [
      {
        id: DESC
      }
    ],
    limit: 3,
    offset: 10
    }) {
    name
    moviesConnection(first: 32, after: "jksdfnoifdahh=") {
      edges {
        node {
          id
        }
      }
    }
    movies(options: { limit: 32, offset: 100}) {
      id
    }
  }
}
```
As is visible in this GraphQL query, the pagination arguments are inconsistent between the two styles.


## Proposed Solution

Separate the Connection API to the Standard API making it an opt-in feature.

### Usage Examples

It will be not longer possible to combine the behaviour of the Standard API with the Connection API, 
for instance the follwing GraphQL query will be not longer valid:

```graphql
query Actors {
  actors {
    name
    moviesConnection{
      edges {
        node {
          id
        }
      }
    }
  }
}
```
The Connection API node types should be separated from the Standard API node types.
## Risks

What risks might cause us to go over the appetite described above?

### Security consideration

Please take some time to think about potential security issues/considerations for the proposed solution.
For example: How can a malicious user abuse this? How can we prevent that in such case?

## Out of Scope

What are we definitely not going to implement in this solution?


TODO: 
- filters
- exclude
