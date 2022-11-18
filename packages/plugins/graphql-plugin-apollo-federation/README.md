# Apollo Federation plugin for the Neo4j GraphQL Library

## TODO

* Hook into type definition validation so that Federation metadata does not cause failure
* Allow the plugin to be used without passing in type definitions and driver - pass through from library
* Improve how `@shareable` gets added to the schema - perhaps we let users opt in? i.e. directive on `User` ends up on that type as well as all we generate from it
* Test test test - a lot still does not work
* Apollo compatibility tests - in progress
