# GraphQL Toolbox Next

For reference: The first [RFC concerning the GraphQL UI PoC](https://github.com/neo4j/graphql/blob/dev/docs/rfcs/rfc-009-graphql-ui-poc.md).

## Problem

The GraphQL Toolbox needs to be further improved for a better initial developer experience of Neo4j GraphQL. Central hosting, tracking and adding Canny for feedback collection are additional pieces that should lift the GraphQL Toolbox to a more complete product.
Moreover, the focus should be on increasing the developer experience for the schema builder as it is unique to our use case, the `@neo4j/graphql` library.

### User audience

The `@neo4j/graphql` lib's user audience are full stack developers who want a GraphQL API quickly without worrying about the database.

The GraphQL Toolbox can further include developers wanting to experiment with GraphQL and Neo4j in general, yet also developers who want to experiment with/edit the (introspected) schema.  
The main aim is for prototyping and rapid development for both experienced as well as inexperienced users.

### Requirements

(ordered by priority)
-   (Must) Central hosting of the GraphQL Toolbox, including a workflow to publish the latest release.
-   Add a link or button to [Canny](https://canny.io/) for feedback collection
-   Schema builder editor: autocompletion for directives etc, leverage the `@neo4j/graphql` documentation for a better developer experience
-   Make it more prominent that the GraphQL Toolbox uses `@neo4j/graphql` by adding links to the documentation
-   Address the highest priority/impact bugs and pebbles listed in the Trello feedback card

Stretch goals:
-   Track basic metrics with [Segment](https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/), see more details below
-   Highlight the keybindings, see below
-   Investigate the requirements and effort for adding the GraphQL Toolbox to NX

Related:

-   Conduct user interviews with both internal and external people (done by the UX team)
-   (Fine) tune and adjust the developer experience to the determined user journey.

#### Tracking

Create a spreadsheet to list all the tracking events, their name, why we track it, etc.

Questions we need to answer:

-   Is the documentation explorer (opened via the `?`) being used?
-   Is the database introspection (the `generate TypeDefs` button) being used?
-   Are users changing the editor theme?
-   Is the `debug` toggle setting being used?
-   Is the `regex` toggle setting being used?
-   Is the `check constraint` toggle setting being used?
-   Is the `create constraint` toggle setting being used?

#### Keybindings

1. CTRL+ENTER - to run the query
2. CTRL+SHIFT+P - to prettify the code
3. list additional..

## Risks

Arranging central hosting needs to be addressed as early as possible as we rely on other people/teams for its completion.
The same is true regarding the tracking on Segment. We can create the source (that would be the GraphQL Toolbox) ourselves yet linking it to the correct destination (for example Mixpanel or BigQuery) has to be done by another person.

### Rabbit holes

Addressing too many pebbles and style issues.

### Security consideration

Do not track any sensitive data! The tracking will follow the standards applied at Neo4j and other frontend products at Neo4j.  
The credentials (login page) to access the database are encrypted and stored in the web browsers' local storage.  
The GraphQL Toolbox leverages the `@neo4j/graphql` library and does not alter any of its behaviours.  

## Out of Scope

Show the query history in the Editor view  
Using tabs for storing different queries & parameters in the Editor view
