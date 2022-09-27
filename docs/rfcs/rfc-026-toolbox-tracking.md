# GraphQL Toolbox Tracking

For reference:
- The first [RFC concerning the GraphQL UI PoC](https://github.com/neo4j/graphql/blob/dev/docs/rfcs/rfc-009-graphql-ui-poc.md)
- The second [RFC concerning the GraphQL Toolbox Improvements](https://github.com/neo4j/graphql/blob/dev/docs/rfcs/rfc-015-graphql-toolbox-improvement.md)

## Problem

Now that the GraphQL Toolbox has been published under https://graphql-toolbox.neo4j.io and has had some exposure in various forms it's time to gather data
regarding how the GraphQL Toolbox is used. Hence adding basic tracking metrics is proposed in this pitch. 


### User audience

The `@neo4j/graphql` library's user audience are full stack developers who want a GraphQL API quickly without worrying about the database.

The GraphQL Toolbox can further include developers wanting to experiment with GraphQL and Neo4j in general, yet also developers who want to experiment with/edit the (introspected) schema.  
The main aim is for prototyping and rapid development for both experienced as well as inexperienced users.

### Tracking consent
We need to ask for tracking consent. Opt-in? Or can we do opt-out?

### Requirements

Track basic metrics with [Segment](https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/). Segment offers a JS library that we can leverage.
Create a spreadsheet to list all the tracking events, their name, why we track it, etc. See a proposed structure of the document below with an example entry:

| Event Category |  Event | Display Name  | Event fires once for every time  | Property  | Property type  | Value  | Why capture this?  | 
|---|---|---|---|---| ---|---|---|
| Environment Info  | toolbox-ready  |  Toolbox loaded | Toolbox app loaded  |  urlParameterPresent | Boolean |  - |  Track if the URL parameters are used |
 		 					

A list of questions we need to answer:

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

=> TODO: refine the questions and pick the most valuable ones!

## Risks

Tracking events which have no or low business or UX value.
We rely on other people within the organisation to link the Segment source (the GraphQL Toolbox) to the correct destination (for example Mixpanel or BigQuery).

### Rabbit holes

tbd

### Security consideration

Do not track any sensitive data! The tracking will follow the standards applied at Neo4j and other frontend products at Neo4j.  

## Out of Scope

Evaluating the tracking results
