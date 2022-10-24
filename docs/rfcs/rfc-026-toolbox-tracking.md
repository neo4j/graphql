# GraphQL Toolbox Tracking

For reference:
- The first [RFC concerning the GraphQL UI PoC](https://github.com/neo4j/graphql/blob/dev/docs/rfcs/rfc-009-graphql-ui-poc.md)
- The second [RFC concerning the GraphQL Toolbox Improvements](https://github.com/neo4j/graphql/blob/dev/docs/rfcs/rfc-015-graphql-toolbox-improvement.md)

## Problem

Now that the GraphQL Toolbox has been published under https://graphql-toolbox.neo4j.io and has had some exposure in various forms it's time to gather data
regarding how the GraphQL Toolbox is used. Hence adding tracking metrics is proposed in this pitch. 

### Tracking consent

The user needs to know that we are tracking certain events and needs to have the option to opt out.

We can display a message that we enabled tracking by default and have a switch/checkbox in the settings for the user to allow/deny tracking at any time.


### Requirements

Track basic metrics with [Segment](https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/). Segment offers a JS library that we can leverage.

Create a spreadsheet to list all the tracking events, their name, why we track it, etc. See a proposed structure of the document below with an example entry:

| Event Category |  Event | Display Name  | Event fires once for every time  | Property  | Property type  | Value  | Why capture this?  | 
|---|---|---|---|---| ---|---|---|
| Environment Info  | toolbox-ready  |  Toolbox loaded | Toolbox app loaded  |  urlParameterPresent | Boolean |  - |  Track if the URL parameters are used |

#### Type definitions and queries/mutations

Track high level details of type definitions.
- Number of types
- Quantity of directive usage
- Number of interfaces and unions

Track high level information of queries/mutations:
- Per executed query/mutation: complexity calculation with third-party lib. The [graphql-query-complexity](https://github.com/slicknode/graphql-query-complexity) lib seems to be the best choice.


#### Additional tracking

- Track "Want us to host your API for you? Click here to register your interest"
- Track "Publish your API feature coming soon! Click here to register your interest"

#### Tracking with UX focus

A list of questions we potentially need to answer (roughly ordered by priority):

-   Is the database introspection being used via the initial modal?
-   Is the database introspection (the `introspect` button) being used via the type definitions editor?
-   Are users changing the editor theme (dark and white editor background)?
-   Are users saving type definitions as favorites?
-   Is the `debug` toggle setting being used?
-   Is the `regex` toggle setting being used?
-   Is the `constraints` setting being used? Which value (`check` or `create`) is it?
-   Are users switching between databases via the top bar?
-   Are users adding queries or mutations via the button at the bottom of the Explorer component? Which type (`query` or `mutation`)?
-   Are users reading the schema documentation in the Help&Learn drawer? Or via enabling the docs in the Explorer component?


## Risks

Tracking events which have no or low business or UX value.

We rely on other people within the organisation to link the Segment source (the GraphQL Toolbox) to the correct destination (for example Mixpanel or BigQuery).

### Rabbit holes

- Track too many UX related features

### Security consideration

Do not track any sensitive data! The tracking will follow the standards applied at Neo4j and other frontend products at Neo4j.  

## Out of Scope

- Evaluating or analysing the tracking results
