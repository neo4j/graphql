# @neo4j/graphql-toolbox

## 1.2.2

### Patch Changes

-   [#1987](https://github.com/neo4j/graphql/pull/1987) [`85e725df6`](https://github.com/neo4j/graphql/commit/85e725df652819b1ce2eb29e9c2de477eb2925bb) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Toolbox warning tooltip when using insecure WebSocket on a HTTPS web page. Doc Explorer styling fix.

-   [#2008](https://github.com/neo4j/graphql/pull/2008) [`206d73901`](https://github.com/neo4j/graphql/commit/206d739012ac9d3d62b3acb9acb217134fb771f0) Thanks [@tbwiss](https://github.com/tbwiss)! - boyscouting: store the position of the grid dividers. Use NDL tokens for colors

-   [#2014](https://github.com/neo4j/graphql/pull/2014) [`66c040179`](https://github.com/neo4j/graphql/commit/66c0401791e9fc0182a2e5c271bff11bd05f5fef) Thanks [@mjfwebb](https://github.com/mjfwebb)! - refactor: fix linting errors and add types

-   Updated dependencies [[`f958503e0`](https://github.com/neo4j/graphql/commit/f958503e059fcfabc46628fd651914e08d29b998), [`2abb6036f`](https://github.com/neo4j/graphql/commit/2abb6036f267ba0c1310f36e3a7882948800ae05), [`e978b185f`](https://github.com/neo4j/graphql/commit/e978b185f1d0fe4ec7bd75ecbaa03a5216105a14), [`a037e34a9`](https://github.com/neo4j/graphql/commit/a037e34a9bb1f8eff07992e0d08b9c0fbf5f5a11), [`a965bd861`](https://github.com/neo4j/graphql/commit/a965bd861bef0fab93480705ac4f011f1f6c534f), [`8260fb845`](https://github.com/neo4j/graphql/commit/8260fb845aced51dbf90425870b766210c96a22c), [`99a7f707a`](https://github.com/neo4j/graphql/commit/99a7f707ad4afd2ef1613e8218de713836d165f3), [`66c040179`](https://github.com/neo4j/graphql/commit/66c0401791e9fc0182a2e5c271bff11bd05f5fef), [`1d90a5252`](https://github.com/neo4j/graphql/commit/1d90a5252abf724fc91b92fe3a86ee69c0ab26bb), [`1ceb09860`](https://github.com/neo4j/graphql/commit/1ceb09860e256ea5f7bebe4797c31045d3ca9ece), [`972a06c83`](https://github.com/neo4j/graphql/commit/972a06c83db82bbef49c56f861d07ff688b99cb5)]:
    -   @neo4j/graphql@3.8.0
    -   @neo4j/introspector@1.0.2

## 1.2.1

### Patch Changes

-   Updated dependencies [[`957da9430`](https://github.com/neo4j/graphql/commit/957da943008508b43e996efea0c7fa0fe7c08495), [`4e6a38799`](https://github.com/neo4j/graphql/commit/4e6a38799a470bc9846b3800e3abbdd508a88e38), [`1c589e246`](https://github.com/neo4j/graphql/commit/1c589e246f0ce9ffe82c5e7612deb4e7bac7c6e1), [`31c287458`](https://github.com/neo4j/graphql/commit/31c2874588842501636fd754fe18bbc648e4e849), [`37a77f97c`](https://github.com/neo4j/graphql/commit/37a77f97cab35edf2ab0a09cb49800564ac99e6f), [`8b6d0990b`](https://github.com/neo4j/graphql/commit/8b6d0990b04a985e06d9b9f880ddd86b75cd00d5), [`5955a6a36`](https://github.com/neo4j/graphql/commit/5955a6a363b0490916ca2765e457b01be751ad20)]:
    -   @neo4j/graphql@3.7.0

## 1.2.0

### Minor Changes

-   [#1873](https://github.com/neo4j/graphql/pull/1873) [`01ca3450`](https://github.com/neo4j/graphql/commit/01ca3450c8cc84c5382640629eff133d70b9421a) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Toolbox restructure after UX feedback

    -   Prompt to introspect type definitions on connection
    -   Restructuring of the page
        -   Type definitions/query selector component moves to the top (forming a second "top bar")
        -   Introspect button to be inside type definitions
        -   Back to "Prettify" text in the button
        -   Beta tag, use a blue label
        -   Move the documentation sidebar to also be on the left, toggled by a slider in the Explorer
    -   Tweak the "Add new Query/Mutation" button in the Explorer

### Patch Changes

-   [#1919](https://github.com/neo4j/graphql/pull/1919) [`7e90ecfe`](https://github.com/neo4j/graphql/commit/7e90ecfed5a3cc61dda8d54d525c190842f0d1ef) Thanks [@tbwiss](https://github.com/tbwiss)! - fix: Support for Neo4j GraphQL Toolbox in Safari web browser

*   [#1885](https://github.com/neo4j/graphql/pull/1885) [`1a28d53f`](https://github.com/neo4j/graphql/commit/1a28d53f9c03c61949c239c08800a5ee363eca44) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Use the new Toolbox logo and update the documentation for the Toolbox page.

*   Updated dependencies [[`037856af`](https://github.com/neo4j/graphql/commit/037856afc74e9739707cb5a92cb830edc24a43b1), [`7e90ecfe`](https://github.com/neo4j/graphql/commit/7e90ecfed5a3cc61dda8d54d525c190842f0d1ef), [`7affa891`](https://github.com/neo4j/graphql/commit/7affa8912e16bf3ebf27bd5460eb5c671f9b672a), [`07109478`](https://github.com/neo4j/graphql/commit/07109478b0dbd7ca4cf99f31e720f09ea8ad77c2), [`07d2b61e`](https://github.com/neo4j/graphql/commit/07d2b61e35820def7c399b110a7bc99217f76e60), [`d7870c31`](https://github.com/neo4j/graphql/commit/d7870c31faaa1e211236fac4e50714937f07ce22)]:
    -   @neo4j/graphql@3.6.3
