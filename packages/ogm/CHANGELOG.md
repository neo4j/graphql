# @neo4j/graphql-ogm

## 4.0.0-beta.2

### Major Changes

* [#3592](https://github.com/neo4j/graphql/pull/3592) [`2ba1d45b5`](https://github.com/neo4j/graphql/commit/2ba1d45b5bf642975381ca8431cb10094151586d) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The Neo4j GraphQL Library now only accepts a `string`, `DocumentNode` or an array containing these types. A callback function returning these is also accepted. This is a reduction from `TypeSource` which also included types such as `GraphQLSchema` and `DefinitionNode`, which would have resulted in unexpected behaviour if passed in.

### Patch Changes

* Updated dependencies [[`2ba1d45b5`](https://github.com/neo4j/graphql/commit/2ba1d45b5bf642975381ca8431cb10094151586d), [`a16ba357c`](https://github.com/neo4j/graphql/commit/a16ba357cb745ba728009c5e6b531b4c56a62f43), [`56857a3e5`](https://github.com/neo4j/graphql/commit/56857a3e53134ad9f46f3265567c55570f674aab), [`e9bf1e619`](https://github.com/neo4j/graphql/commit/e9bf1e619ee71ead228530a9d46834a655686c6d), [`9354860ae`](https://github.com/neo4j/graphql/commit/9354860ae2f5f4a82179de874344724862d0c231)]:
  * @neo4j/graphql@4.0.0-beta.2

## 4.0.0-beta.1

### Patch Changes

* Updated dependencies [[`be5dcdcde`](https://github.com/neo4j/graphql/commit/be5dcdcdec49adb6748dd8fc34b0b6f3e6d783fa)]:
  * @neo4j/graphql@4.0.0-beta.1

## 4.0.0-beta.0

### Major Changes

* [#3673](https://github.com/neo4j/graphql/pull/3673) [`aa11d5251`](https://github.com/neo4j/graphql/commit/aa11d525111cfda005581ed2327407b9c9c319f9) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Programmatic toggling of debug logging is now done using the `debug` option of the constructor.

* [#3645](https://github.com/neo4j/graphql/pull/3645) [`7df67be49`](https://github.com/neo4j/graphql/commit/7df67be4991b8829acbd00651c66b41558729008) Thanks [@darrellwarde](https://github.com/darrellwarde)! - The minimum version of `neo4j-driver` is now `5.8.0`, please upgrade. The `boomkark` field in the selection set has been marked as deprecated and will be removed in version `5.0.0` of the library.

* [#3671](https://github.com/neo4j/graphql/pull/3671) [`b3951fa81`](https://github.com/neo4j/graphql/commit/b3951fa81232a968fe492a4b10ea54afc604e2d2) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Remove `nodes` from the public API of the `OGM` class.

* [#3687](https://github.com/neo4j/graphql/pull/3687) [`1ad4328e4`](https://github.com/neo4j/graphql/commit/1ad4328e4bba39801aa96bf961e6e5c5a2a9ce8d) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Validation of type definitions is now configured using the `validate` boolean option in the constructor, which defaults to `true`.

* [#2598](https://github.com/neo4j/graphql/pull/2598) [`257aa4c97`](https://github.com/neo4j/graphql/commit/257aa4c97a0d367063725dff703fdd30f0f8ecb5) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Remove all arguments from IExecutableSchemaDefinition apart from `typeDefs` and `resolvers`. This is to simplify the API and to remove any unexpected behaviours from arguments which we blindly pass through.

* [#3674](https://github.com/neo4j/graphql/pull/3674) [`59e369992`](https://github.com/neo4j/graphql/commit/59e369992b2226a3c5feec72f2799e2b30765819) Thanks [@darrellwarde](https://github.com/darrellwarde)! - `cypherQueryOptions` moved into context-only, as a per-request option.

### Patch Changes

* Updated dependencies [[`ea1bae3c3`](https://github.com/neo4j/graphql/commit/ea1bae3c3b8ec53febfa056c5fec25aa9b0c5c2a), [`0fb2592b4`](https://github.com/neo4j/graphql/commit/0fb2592b4271adc02f4bbbf6e467eec5f7742be1), [`c9ee9e757`](https://github.com/neo4j/graphql/commit/c9ee9e757427f512950ec58aad7e30923b297a05), [`4a78e7a8d`](https://github.com/neo4j/graphql/commit/4a78e7a8d70d3ff1ebaff8ba63ce1f9e5849d8e6), [`8d3aff007`](https://github.com/neo4j/graphql/commit/8d3aff007c0d5428313cef23602e9a4ef5ef3792), [`b3951fa81`](https://github.com/neo4j/graphql/commit/b3951fa81232a968fe492a4b10ea54afc604e2d2), [`2167c9ac1`](https://github.com/neo4j/graphql/commit/2167c9ac10b178ad881b12310fc798fc1f77b262), [`29d68ad51`](https://github.com/neo4j/graphql/commit/29d68ad515bcd2ee573d40387978250f92f83fe9), [`395e12f14`](https://github.com/neo4j/graphql/commit/395e12f14e0e7fffe50e3841ca5e69da459855d2), [`15a7f0418`](https://github.com/neo4j/graphql/commit/15a7f04188bcc676477ec562e24b27851a927905), [`93b9d806b`](https://github.com/neo4j/graphql/commit/93b9d806b12c79dae7491b901378acf9d43f1c06), [`d4aea32c6`](https://github.com/neo4j/graphql/commit/d4aea32c66aa1dcbf7b3399165adf74fed36e92e), [`5ea18136e`](https://github.com/neo4j/graphql/commit/5ea18136e36303efc0806cc7027b7dfce13e1fa4), [`aa11d5251`](https://github.com/neo4j/graphql/commit/aa11d525111cfda005581ed2327407b9c9c319f9), [`f1225baa7`](https://github.com/neo4j/graphql/commit/f1225baa75c71ad82e36e9fb250477382eb6757c), [`7df67be49`](https://github.com/neo4j/graphql/commit/7df67be4991b8829acbd00651c66b41558729008), [`7743399d3`](https://github.com/neo4j/graphql/commit/7743399d320b26126bb6e83bcd498c1c78517a83), [`e5b53a597`](https://github.com/neo4j/graphql/commit/e5b53a5976a2880e0efdecddcddcfb427015c823), [`3896544b5`](https://github.com/neo4j/graphql/commit/3896544b50939df38a792bcd9b41bc77f25bc5a9), [`8f0656b35`](https://github.com/neo4j/graphql/commit/8f0656b35b86a1d4966dea8cdb2a8ee5a3505dd6), [`c9f35f10c`](https://github.com/neo4j/graphql/commit/c9f35f10c0fde1af7b82a3adbd7137955705495a), [`1ad4328e4`](https://github.com/neo4j/graphql/commit/1ad4328e4bba39801aa96bf961e6e5c5a2a9ce8d), [`2ab3d5212`](https://github.com/neo4j/graphql/commit/2ab3d521277d66afd7acaea00aa56d44f10480bd), [`257aa4c97`](https://github.com/neo4j/graphql/commit/257aa4c97a0d367063725dff703fdd30f0f8ecb5), [`ce84c47cc`](https://github.com/neo4j/graphql/commit/ce84c47cc610366def7d3abd9227ecb5244ef9d1), [`5b5f08ce7`](https://github.com/neo4j/graphql/commit/5b5f08ce764f431fa685c8320351236a9aaf57a0), [`9f5a44545`](https://github.com/neo4j/graphql/commit/9f5a445455280abfcf862c2cf23ce44e7a11bc0d), [`9f3a9374e`](https://github.com/neo4j/graphql/commit/9f3a9374e5272577f2453cd3704c6924526f8b45), [`59e369992`](https://github.com/neo4j/graphql/commit/59e369992b2226a3c5feec72f2799e2b30765819)]:
  * @neo4j/graphql@4.0.0-beta.0

## 3.24.2

### Patch Changes

* Updated dependencies [[`9354860ae`](https://github.com/neo4j/graphql/commit/9354860ae2f5f4a82179de874344724862d0c231)]:
  * @neo4j/graphql@3.24.2

## 3.24.1

### Patch Changes

* Updated dependencies [[`be5dcdcde`](https://github.com/neo4j/graphql/commit/be5dcdcdec49adb6748dd8fc34b0b6f3e6d783fa)]:
  * @neo4j/graphql@3.24.1

## 3.24.0

### Minor Changes

* [#3639](https://github.com/neo4j/graphql/pull/3639) [`09cc28ef2`](https://github.com/neo4j/graphql/commit/09cc28ef26f13c46c220bd160d68c5f6c4668f39) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Encourages switching from `driverConfig` to `sessionConfig` in both constructor and context. Can be used to switch database, and to use impersonation and user switching.

### Patch Changes

* [#3607](https://github.com/neo4j/graphql/pull/3607) [`12ee8b8f4`](https://github.com/neo4j/graphql/commit/12ee8b8f48043d3bf8cd7a0df4b001340e90c0c0) Thanks [@MacondoExpress](https://github.com/MacondoExpress)! - Ignore the schema configuration directives for OGM purposes. Fix #3591

* Updated dependencies [[`c55a2b6fd`](https://github.com/neo4j/graphql/commit/c55a2b6fd36f9eb2ba5f51be3f21e97b68789fcc), [`cd884be5c`](https://github.com/neo4j/graphql/commit/cd884be5c07870ea778f5d81db5c55d45eca6dc3), [`09cc28ef2`](https://github.com/neo4j/graphql/commit/09cc28ef26f13c46c220bd160d68c5f6c4668f39)]:
  * @neo4j/graphql@3.24.0

## 3.23.1

### Patch Changes

* [#3601](https://github.com/neo4j/graphql/pull/3601) [`5556221c8`](https://github.com/neo4j/graphql/commit/5556221c82c8bf676e72bf6f3113473e271df1fb) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Ignore `@authentication`, `@authorization` and `subscriptionsAuthorization` directives in the OGM.

* Updated dependencies [[`0a5e91bb2`](https://github.com/neo4j/graphql/commit/0a5e91bb2d7db61802ffe31517f60949884f4be5)]:
  * @neo4j/graphql@3.23.1

## 3.23.0

### Minor Changes

* [#3581](https://github.com/neo4j/graphql/pull/3581) [`775fdea1d`](https://github.com/neo4j/graphql/commit/775fdea1d7af274094a7dd56018e75fb2b2596e2) Thanks [@ID!](https://github.com/ID!)! - This release includes the addition of three new directives for authentication and authorization:

    The `@authentication` directive is used to configure authentication checks at either the schema, object or field level:

    ```graphql
    type Post @authentication(operations: [CREATE]) {
        content: String!
    }
    ```

    The `@authorization` directive is used to configure fine-grained authorization against node properties:

    ```graphql
    type User @authorization(validate: [{ where: { node: { id: "$jwt.sub" } } }]) {
        id: ID!
    }
    ```

    The `@subscriptionsAuthorization` directive is used to configure fine-grained authorization specifically for Subscriptions events:

    ```graphql
    type Post @subscriptionsAuthorization(filter: [{ where: { node: { author: "$jwt.sub" } } }]) {
        likes: Int!
    }
    ```

    These three directives supersede the `@auth` directive, which will be removed in version 4.0.0 of the Neo4j GraphQL Library.

### Patch Changes

* Updated dependencies [[`775fdea1d`](https://github.com/neo4j/graphql/commit/775fdea1d7af274094a7dd56018e75fb2b2596e2)]:
  * @neo4j/graphql@3.23.0

## 3.22.0

### Patch Changes

* [#3117](https://github.com/neo4j/graphql/pull/3117) [`c30569a97`](https://github.com/neo4j/graphql/commit/c30569a976f0f6a436ce11016845be47852a54cd) Thanks [@g10](https://github.com/g10)! - feat: expose `assertIndexesAndConstraints` on OGM

* [#3556](https://github.com/neo4j/graphql/pull/3556) [`4f221fdb2`](https://github.com/neo4j/graphql/commit/4f221fdb2d416f41c77a35bd6c7779f16927d246) Thanks [@darrellwarde](https://github.com/darrellwarde)! - Preserve library generated casing when generating TypeScript types using the OGM.

* Updated dependencies [[`f779a0061`](https://github.com/neo4j/graphql/commit/f779a00612adc4e0c42a3696435cbf6072dcfe31), [`cc201e6fc`](https://github.com/neo4j/graphql/commit/cc201e6fc6f0146f0cf80aad2bcaf086a215554c), [`56a733023`](https://github.com/neo4j/graphql/commit/56a733023f6f300b92c8811e37bf6884dc661133)]:
  * @neo4j/graphql@3.22.0

## 3.21.0

### Patch Changes

* Updated dependencies [[`baa787745`](https://github.com/neo4j/graphql/commit/baa787745f5fef2af6b29ba3b4722a51f94b1961), [`8c99be2fe`](https://github.com/neo4j/graphql/commit/8c99be2fe3ef5a831c8f043403dedf980cf84f86), [`b891355e5`](https://github.com/neo4j/graphql/commit/b891355e58de1c56df68ce528a0a814d5202cab3), [`0f32311ea`](https://github.com/neo4j/graphql/commit/0f32311ea685c996f35a62410a21ef1d9f495b46), [`5616aa662`](https://github.com/neo4j/graphql/commit/5616aa662256e416b8401c8e50be79db194dfb28), [`f19a57ca2`](https://github.com/neo4j/graphql/commit/f19a57ca236cb608c8138237751c4432ede6233f), [`1d5506525`](https://github.com/neo4j/graphql/commit/1d550652512331f3fc69bf3b5307fbcb3fd79aab), [`0a444662b`](https://github.com/neo4j/graphql/commit/0a444662b2ac986971076505fbb6c17aec4ea539), [`8c99be2fe`](https://github.com/neo4j/graphql/commit/8c99be2fe3ef5a831c8f043403dedf980cf84f86), [`cc7c8e6a9`](https://github.com/neo4j/graphql/commit/cc7c8e6a9ba5b880c971efbfcd36485c92948a6b), [`f4d691566`](https://github.com/neo4j/graphql/commit/f4d6915661ef5f18e0d5fa3bd1b96d3564d94ee8)]:
  * @neo4j/graphql@3.21.0

## 3.20.1

### Patch Changes

* Updated dependencies [[`449d66fbd`](https://github.com/neo4j/graphql/commit/449d66fbddb061c40bfd3df10c8c12bf037960d7)]:
  * @neo4j/graphql@3.20.1

## 3.20.0

### Patch Changes

* Updated dependencies [[`6cce9ffe0`](https://github.com/neo4j/graphql/commit/6cce9ffe0605795be8e2e1990860d4ea0bd256ec), [`a39b22fc1`](https://github.com/neo4j/graphql/commit/a39b22fc1f8f1227cac5a7efbaab1d855062054e)]:
  * @neo4j/graphql@3.20.0

## 3.19.0

### Patch Changes

* Updated dependencies [[`cc08bcd8a`](https://github.com/neo4j/graphql/commit/cc08bcd8a07044e38380fada05893de980351644), [`dcfe28b49`](https://github.com/neo4j/graphql/commit/dcfe28b4912bb328a03caab48991f0903f000751), [`ce573b770`](https://github.com/neo4j/graphql/commit/ce573b7705a01caadcc1ad10984f85976451ca2c), [`43e189c14`](https://github.com/neo4j/graphql/commit/43e189c14853cd626e14b53338b4ef0ca7e489b8)]:
  * @neo4j/graphql@3.19.0

## 3.18.3

### Patch Changes

* Updated dependencies [[`e8092aa85`](https://github.com/neo4j/graphql/commit/e8092aa855244f7da21bb82f874bfda534a6fa4b), [`99fe4b4b8`](https://github.com/neo4j/graphql/commit/99fe4b4b813538fa985111918bf6ffe2ef458f05)]:
  * @neo4j/graphql@3.18.3

## 3.18.2

### Patch Changes

* Updated dependencies [[`a8aabfeca`](https://github.com/neo4j/graphql/commit/a8aabfecad39b371fa82d16ea00e1e45d4044d05), [`8657dff82`](https://github.com/neo4j/graphql/commit/8657dff8274ea3d3a4a42c18c8e81232748cbeff)]:
  * @neo4j/graphql@3.18.2

## 3.18.1

### Patch Changes

* Updated dependencies [[`cbc15970c`](https://github.com/neo4j/graphql/commit/cbc15970cd87e5cdcfbae40ce5bacf1fb819ade8)]:
  * @neo4j/graphql@3.18.1

## 3.18.0

### Patch Changes

* Updated dependencies [[`7a2f2acc4`](https://github.com/neo4j/graphql/commit/7a2f2acc434d1996a4b3785416acb0c46ad7f199), [`ce5fb9eb3`](https://github.com/neo4j/graphql/commit/ce5fb9eb36a08dde95de605b49f842876b1c1515)]:
  * @neo4j/graphql@3.18.0

## 3.17.2

### Patch Changes

* Updated dependencies [[`ff99e317c`](https://github.com/neo4j/graphql/commit/ff99e317cff519b1ae26bd52c70b2d89ac923512), [`b6e4ebdc6`](https://github.com/neo4j/graphql/commit/b6e4ebdc62770951e333893c8f9562a2c9cbb99f), [`0ce8bcf4b`](https://github.com/neo4j/graphql/commit/0ce8bcf4b7b021e341496cde8b10140f00d47c84), [`39abf6591`](https://github.com/neo4j/graphql/commit/39abf65915bb100baab15f3e838b899152109e63), [`03141c81e`](https://github.com/neo4j/graphql/commit/03141c81e38e85bc6499231ae90a19e3fbdb17c3)]:
  * @neo4j/graphql@3.17.2

## 3.17.1

### Patch Changes

* Updated dependencies [[`56d126238`](https://github.com/neo4j/graphql/commit/56d1262389ff38522d7b9c3964e878415994b1fa), [`cfe96e713`](https://github.com/neo4j/graphql/commit/cfe96e713ea54e6c670d7fe0dc535e7065b81d9c), [`8e41a724a`](https://github.com/neo4j/graphql/commit/8e41a724a3abae1fa63fb5cd4cc1cf7a08e124d1), [`eaf16062c`](https://github.com/neo4j/graphql/commit/eaf16062c9a27eacdea53de87423b726bef7bed6), [`514bb64b6`](https://github.com/neo4j/graphql/commit/514bb64b6c22e886b3d8c06fc48b968af86bd421), [`99985018e`](https://github.com/neo4j/graphql/commit/99985018e6894d827efbfe1fa5fad6cc177594eb)]:
  * @neo4j/graphql@3.17.1

## 3.17.0

### Patch Changes

* Updated dependencies [[`6f0d9c06d`](https://github.com/neo4j/graphql/commit/6f0d9c06d9b34d30211bdf703bb0b26844033179), [`a0d4dc4cf`](https://github.com/neo4j/graphql/commit/a0d4dc4cf5d007235be3c7e36202aea9d39b6542), [`6421735f0`](https://github.com/neo4j/graphql/commit/6421735f014f0e2edacb1be7ba15c8819a1a0adb), [`cdbf768a0`](https://github.com/neo4j/graphql/commit/cdbf768a05323b15595fe26b5d047866f0f0c036), [`1902f903f`](https://github.com/neo4j/graphql/commit/1902f903f89453f2d17be909e2b05f1c12ac39a9), [`1a2101c33`](https://github.com/neo4j/graphql/commit/1a2101c33d00a738be26c57fa378d4a9e3bede41)]:
  * @neo4j/graphql@3.17.0

## 3.16.1

### Patch Changes

* Updated dependencies [[`0fe3a6853`](https://github.com/neo4j/graphql/commit/0fe3a68536e0cc5ec2cdd05057d038ca38358ff8), [`79ef38c5d`](https://github.com/neo4j/graphql/commit/79ef38c5dd43da19a64b0e7c25019209e19415f3)]:
  * @neo4j/graphql@3.16.1

## 3.16.0

### Patch Changes

* Updated dependencies [[`29e1d659a`](https://github.com/neo4j/graphql/commit/29e1d659aa7c48c73e6f19ed37bff320bff4dfeb), [`022861de2`](https://github.com/neo4j/graphql/commit/022861de2e1d69f8b56444b1c92308b2365e599c), [`8859980f9`](https://github.com/neo4j/graphql/commit/8859980f93598212fb226aa0172a0f0091965801), [`a270243bb`](https://github.com/neo4j/graphql/commit/a270243bb3baaa0abadeb395fff5b0036a754c7b), [`3fff70828`](https://github.com/neo4j/graphql/commit/3fff708284e95b4667be5094bbda6cf828a467a9), [`8db2a1e2c`](https://github.com/neo4j/graphql/commit/8db2a1e2ce8a2f8d3077663a6665e0e670652db1), [`44ce8a741`](https://github.com/neo4j/graphql/commit/44ce8a74154182fca7ce6cf269bcd0009e61e34b), [`6d2ba44d4`](https://github.com/neo4j/graphql/commit/6d2ba44d49a043bf4aed5311e368cf0c30719745), [`14df1f827`](https://github.com/neo4j/graphql/commit/14df1f8271323a9d320810f5a19c02e79a5b3d84), [`4f6d4ae97`](https://github.com/neo4j/graphql/commit/4f6d4ae97f1278d37e65a25a10561efdfdeb6bac)]:
  * @neo4j/graphql@3.16.0

## 3.15.0

### Patch Changes

* Updated dependencies [[`f17f6b5b0`](https://github.com/neo4j/graphql/commit/f17f6b5b0259d26cf207a340be027b6c20ec2b81), [`343845b26`](https://github.com/neo4j/graphql/commit/343845b26b577f0126dd3d7f2c070c5d0d1e3bf3), [`6a784dd1f`](https://github.com/neo4j/graphql/commit/6a784dd1ffbaa8c901e04b67f62590545bdd4f5d), [`163cf903d`](https://github.com/neo4j/graphql/commit/163cf903d375222b8455733d7f6a45ae831dea25), [`3fd44b3ef`](https://github.com/neo4j/graphql/commit/3fd44b3ef08d6eebec3cb1dd51111af8bf4e9fb2), [`ef1822849`](https://github.com/neo4j/graphql/commit/ef182284930c8444c7205e2bc398ef17481e6279)]:
  * @neo4j/graphql@3.15.0

## 3.14.2

### Patch Changes

* Updated dependencies [[`785e99db7`](https://github.com/neo4j/graphql/commit/785e99db7c75276ea1380cbef68435fe02dc8049), [`6c38084c0`](https://github.com/neo4j/graphql/commit/6c38084c0f2513085babc6a71b5039adf4b5c7e2), [`788fe93ef`](https://github.com/neo4j/graphql/commit/788fe93ef4d52e8a4fd697ac7f134b0e523ea4de), [`ea1917a5a`](https://github.com/neo4j/graphql/commit/ea1917a5a751fe9df362e687cc1f4d9b353e588f), [`1f8dee357`](https://github.com/neo4j/graphql/commit/1f8dee357296956c90968d79a5a3e0e9343fe2f9), [`f19ef34d7`](https://github.com/neo4j/graphql/commit/f19ef34d7908539fdba6bebc5b2a76fc09cf46c1), [`3252f44d7`](https://github.com/neo4j/graphql/commit/3252f44d7d5453690f0aa0f35b9246a41ff5908b)]:
  * @neo4j/graphql@3.14.2

## 3.14.1

### Patch Changes

* [#2579](https://github.com/neo4j/graphql/pull/2579) [`7f4a3981d`](https://github.com/neo4j/graphql/commit/7f4a3981df423ab39417333e9deec9c328e13e63) Thanks [@Liam-Doodson](https://github.com/Liam-Doodson)! - Fixed the `fulltext` argument in OGM queries

* Updated dependencies [[`95ecaf7c3`](https://github.com/neo4j/graphql/commit/95ecaf7c37b3e6e69bf025d49b5ad00ad44dcb39), [`05280d0f1`](https://github.com/neo4j/graphql/commit/05280d0f16792e8e004c732ab039152d4dd32707), [`26d8a0045`](https://github.com/neo4j/graphql/commit/26d8a00453b03fa14328bcc2f5f4685e7b5e3ba3), [`189352546`](https://github.com/neo4j/graphql/commit/18935254652240c1ad826c3c85a5be873c4dbd20), [`9243fb3af`](https://github.com/neo4j/graphql/commit/9243fb3afc0c04408bf78c1ba581856ccb0e51fc), [`95ecaf7c3`](https://github.com/neo4j/graphql/commit/95ecaf7c37b3e6e69bf025d49b5ad00ad44dcb39), [`95ecaf7c3`](https://github.com/neo4j/graphql/commit/95ecaf7c37b3e6e69bf025d49b5ad00ad44dcb39), [`1b2913803`](https://github.com/neo4j/graphql/commit/1b2913803880bd1e8e1f1b7f79262ae20b1585e3), [`cd4f57a5d`](https://github.com/neo4j/graphql/commit/cd4f57a5ddc67660f7c41fd67e2006e68a8a0e1d), [`88d2cdfc1`](https://github.com/neo4j/graphql/commit/88d2cdfc1265f8a45c384872d32704bf452d36df)]:
  * @neo4j/graphql@3.14.1

## 3.14.0

### Patch Changes

* Updated dependencies [[`9d9bea661`](https://github.com/neo4j/graphql/commit/9d9bea6611851dd3ae9912aa0eb29554ed2b0eb0), [`652ebcdba`](https://github.com/neo4j/graphql/commit/652ebcdbadf71c3e55989672eb1064b52b32828e)]:
  * @neo4j/graphql@3.14.0

## 3.13.1

### Patch Changes

* Updated dependencies [[`1bec3f95d`](https://github.com/neo4j/graphql/commit/1bec3f95d0f469c2a4e879b1904a4d1a4938207e), [`0d70b0704`](https://github.com/neo4j/graphql/commit/0d70b07049a0f4b2391240929aadc54f62eedc42), [`5d349e05c`](https://github.com/neo4j/graphql/commit/5d349e05c08ed655144b9919528ba66047f49443), [`638f3205a`](https://github.com/neo4j/graphql/commit/638f3205ab3b20eb69a7bb33e6c11685d3e53a51), [`2710165e0`](https://github.com/neo4j/graphql/commit/2710165e0bfd200a8755e1b94f363ee17258fcac)]:
  * @neo4j/graphql@3.13.1

## 3.13.0

### Patch Changes

* Updated dependencies [[`12ec721e6`](https://github.com/neo4j/graphql/commit/12ec721e66f7ce570b31be3341c625a48bda304f), [`b981c45f7`](https://github.com/neo4j/graphql/commit/b981c45f76753557c18b1152ad62f258d2bee7f7), [`c06ac56ae`](https://github.com/neo4j/graphql/commit/c06ac56ae84360dc19bccd4545334c8c65b1c768), [`e220f36e0`](https://github.com/neo4j/graphql/commit/e220f36e07bb27aeb5c787e7ebf5b09e7fba2afc), [`b624c7ace`](https://github.com/neo4j/graphql/commit/b624c7aced55493f9df1abcaca91b139713f4186), [`20aa9c05b`](https://github.com/neo4j/graphql/commit/20aa9c05be4c780493d536bc98335fb88d857b6a)]:
  * @neo4j/graphql@3.13.0

## 3.12.2

### Patch Changes

* Updated dependencies [[`82846ef0a`](https://github.com/neo4j/graphql/commit/82846ef0a5ac0c778d295970405626bed829cff3)]:
  * @neo4j/graphql@3.12.2

## 3.12.1

### Patch Changes

* Updated dependencies [[`d71ddb54d`](https://github.com/neo4j/graphql/commit/d71ddb54d811e280357bd37270b9f5cae0c600aa), [`35bbf3197`](https://github.com/neo4j/graphql/commit/35bbf3197ecd3ad576567189242036ac3ee07b57), [`f2a56c738`](https://github.com/neo4j/graphql/commit/f2a56c73854c60144ec2809b855cd52eb1288a43), [`d04699b50`](https://github.com/neo4j/graphql/commit/d04699b50f0dd50984ab6688743f4fe027d797a0), [`27dd34de7`](https://github.com/neo4j/graphql/commit/27dd34de7815824afa490667ce2484f017c823a3), [`f2799750a`](https://github.com/neo4j/graphql/commit/f2799750a0a1aeaecaf9ead5295483e5205ada62), [`9d0859b59`](https://github.com/neo4j/graphql/commit/9d0859b596be29d0e64f6531e2bf0c17325b9a34)]:
  * @neo4j/graphql@3.12.1

## 3.12.0

### Patch Changes

* Updated dependencies [[`0faef6f33`](https://github.com/neo4j/graphql/commit/0faef6f3330d70126817f6496556f5ad85611ad9), [`8642d3d67`](https://github.com/neo4j/graphql/commit/8642d3d67882cda2a0e212bdcf4b56376d419509), [`3b06cafbc`](https://github.com/neo4j/graphql/commit/3b06cafbc9f8ac6bfe43997bdd8e9db784b3907b)]:
  * @neo4j/graphql@3.12.0

## 3.11.1

### Patch Changes

* Updated dependencies [[`2c6d986a1`](https://github.com/neo4j/graphql/commit/2c6d986a19061fd8bc7739a2dd4737e7828e20d0)]:
  * @neo4j/graphql@3.11.1

## 3.11.0

### Patch Changes

* Updated dependencies [[`8eff620b9`](https://github.com/neo4j/graphql/commit/8eff620b93d86d544d4594b69c5058a9092347c0), [`c769933cb`](https://github.com/neo4j/graphql/commit/c769933cba76d16c4f14b2c18aaf5c47415b05d9), [`44fc500eb`](https://github.com/neo4j/graphql/commit/44fc500ebbaff3f8cdfcc676bd2ef8cad2fd58ec), [`b37376e38`](https://github.com/neo4j/graphql/commit/b37376e38e13ab2ed6f0e0eeb99f2d9f17161fd7), [`5ce80724f`](https://github.com/neo4j/graphql/commit/5ce80724f4d45a38e5d4b5d0d369384a4599d51f), [`2c8f3ec37`](https://github.com/neo4j/graphql/commit/2c8f3ec37ce57f281972ddc107a9490392c482df), [`94512c90e`](https://github.com/neo4j/graphql/commit/94512c90e5e37601a4d260f1153ac043639ceb6f), [`74e6fee11`](https://github.com/neo4j/graphql/commit/74e6fee119c8f0c7d30384422e722754411135b9), [`4ee4d40ad`](https://github.com/neo4j/graphql/commit/4ee4d40ad5aca514ddc08091b2501bfa699294e9), [`e7bcf4f0b`](https://github.com/neo4j/graphql/commit/e7bcf4f0b69a75c10e0ee0a604fd35cab09fcfaf)]:
  * @neo4j/graphql@3.11.0

## 3.10.1

### Patch Changes

* Updated dependencies [[`23467c469`](https://github.com/neo4j/graphql/commit/23467c4699287c9d33c0a1004db83ddb9e7e606a)]:
  * @neo4j/graphql@3.10.1

## 3.10.0

### Patch Changes

* Updated dependencies [[`64b3d0777`](https://github.com/neo4j/graphql/commit/64b3d07776685400313603f57e274ad8e821968b), [`cad28dd1f`](https://github.com/neo4j/graphql/commit/cad28dd1f2f92fccf713beee600d2234c7c9709b), [`cad28dd1f`](https://github.com/neo4j/graphql/commit/cad28dd1f2f92fccf713beee600d2234c7c9709b), [`5a748dc32`](https://github.com/neo4j/graphql/commit/5a748dc326ff063a8d8db6c281d681a68b679ade), [`c4ced43c0`](https://github.com/neo4j/graphql/commit/c4ced43c01cdd0d86d60a68906c3e79d847c5394), [`7b8a73cbd`](https://github.com/neo4j/graphql/commit/7b8a73cbd3e6accaaa7d64daa35f25941a7022c1)]:
  * @neo4j/graphql@3.10.0

## 3.9.0

### Patch Changes

* Updated dependencies [[`28742a5bd`](https://github.com/neo4j/graphql/commit/28742a5bd77b21497300248d18ff23206e1ec66f), [`0c89c88ae`](https://github.com/neo4j/graphql/commit/0c89c88ae25bb6c06edac4adff43b47802f45ea1), [`fb1e2c93f`](https://github.com/neo4j/graphql/commit/fb1e2c93f41adeaa61cc458f20a5812472ed3e2c)]:
  * @neo4j/graphql@3.9.0

## 3.8.0

### Patch Changes

* [#2014](https://github.com/neo4j/graphql/pull/2014) [`66c040179`](https://github.com/neo4j/graphql/commit/66c0401791e9fc0182a2e5c271bff11bd05f5fef) Thanks [@mjfwebb](https://github.com/mjfwebb)! - refactor: fix linting errors and add types

* Updated dependencies [[`f958503e0`](https://github.com/neo4j/graphql/commit/f958503e059fcfabc46628fd651914e08d29b998), [`2abb6036f`](https://github.com/neo4j/graphql/commit/2abb6036f267ba0c1310f36e3a7882948800ae05), [`e978b185f`](https://github.com/neo4j/graphql/commit/e978b185f1d0fe4ec7bd75ecbaa03a5216105a14), [`a037e34a9`](https://github.com/neo4j/graphql/commit/a037e34a9bb1f8eff07992e0d08b9c0fbf5f5a11), [`a965bd861`](https://github.com/neo4j/graphql/commit/a965bd861bef0fab93480705ac4f011f1f6c534f), [`8260fb845`](https://github.com/neo4j/graphql/commit/8260fb845aced51dbf90425870b766210c96a22c), [`99a7f707a`](https://github.com/neo4j/graphql/commit/99a7f707ad4afd2ef1613e8218de713836d165f3), [`66c040179`](https://github.com/neo4j/graphql/commit/66c0401791e9fc0182a2e5c271bff11bd05f5fef), [`1d90a5252`](https://github.com/neo4j/graphql/commit/1d90a5252abf724fc91b92fe3a86ee69c0ab26bb), [`1ceb09860`](https://github.com/neo4j/graphql/commit/1ceb09860e256ea5f7bebe4797c31045d3ca9ece), [`972a06c83`](https://github.com/neo4j/graphql/commit/972a06c83db82bbef49c56f861d07ff688b99cb5)]:
  * @neo4j/graphql@3.8.0

## 3.7.0

### Patch Changes

* [#1968](https://github.com/neo4j/graphql/pull/1968) [`4e6a38799`](https://github.com/neo4j/graphql/commit/4e6a38799a470bc9846b3800e3abbdd508a88e38) Thanks [@angrykoala](https://github.com/angrykoala)! - Unpin peer dependencies to support a wider range of versions

* Updated dependencies [[`957da9430`](https://github.com/neo4j/graphql/commit/957da943008508b43e996efea0c7fa0fe7c08495), [`4e6a38799`](https://github.com/neo4j/graphql/commit/4e6a38799a470bc9846b3800e3abbdd508a88e38), [`1c589e246`](https://github.com/neo4j/graphql/commit/1c589e246f0ce9ffe82c5e7612deb4e7bac7c6e1), [`31c287458`](https://github.com/neo4j/graphql/commit/31c2874588842501636fd754fe18bbc648e4e849), [`37a77f97c`](https://github.com/neo4j/graphql/commit/37a77f97cab35edf2ab0a09cb49800564ac99e6f), [`8b6d0990b`](https://github.com/neo4j/graphql/commit/8b6d0990b04a985e06d9b9f880ddd86b75cd00d5), [`5955a6a36`](https://github.com/neo4j/graphql/commit/5955a6a363b0490916ca2765e457b01be751ad20)]:
  * @neo4j/graphql@3.7.0

## 3.6.3

### Patch Changes

* Updated dependencies [[`037856af`](https://github.com/neo4j/graphql/commit/037856afc74e9739707cb5a92cb830edc24a43b1), [`7e90ecfe`](https://github.com/neo4j/graphql/commit/7e90ecfed5a3cc61dda8d54d525c190842f0d1ef), [`7affa891`](https://github.com/neo4j/graphql/commit/7affa8912e16bf3ebf27bd5460eb5c671f9b672a), [`07109478`](https://github.com/neo4j/graphql/commit/07109478b0dbd7ca4cf99f31e720f09ea8ad77c2), [`07d2b61e`](https://github.com/neo4j/graphql/commit/07d2b61e35820def7c399b110a7bc99217f76e60), [`d7870c31`](https://github.com/neo4j/graphql/commit/d7870c31faaa1e211236fac4e50714937f07ce22)]:
  * @neo4j/graphql@3.6.3

## 3.6.2

### Patch Changes

* Updated dependencies [[`68e44f53`](https://github.com/neo4j/graphql/commit/68e44f53672740780cd51d7985f15c85fd7def54)]:
  * @neo4j/graphql@3.6.2

## 3.6.1

### Patch Changes

* Updated dependencies [[`3c2d0658`](https://github.com/neo4j/graphql/commit/3c2d065889159dd4b5c37c24de58cd1b34869790), [`fad52b51`](https://github.com/neo4j/graphql/commit/fad52b513d7835b0a01856c2882ab536df205252)]:
  * @neo4j/graphql@3.6.1

## 3.6.0

### Patch Changes

* Updated dependencies [[`4c8098f4`](https://github.com/neo4j/graphql/commit/4c8098f428937b7bd6bf3d29abb778618c7b030c), [`36ebee06`](https://github.com/neo4j/graphql/commit/36ebee06352f5edbbd3748f818b8c0a7c5262681), [`ba713faf`](https://github.com/neo4j/graphql/commit/ba713faf7da05c6f9031c83542dbc51bc1a0239e), [`801cdaea`](https://github.com/neo4j/graphql/commit/801cdaea608e83fa3ba9fffb56b4f93db88d149a), [`21a0c58c`](https://github.com/neo4j/graphql/commit/21a0c58c85c8368c70c6a83a428f0c20231557b4), [`4d62eea7`](https://github.com/neo4j/graphql/commit/4d62eea78fe4a2d72805697a0adcb0b21625e87e), [`0a49f56d`](https://github.com/neo4j/graphql/commit/0a49f56dbd45eb3ca69ceafce4ed308cdc1d6e90), [`28ffcf88`](https://github.com/neo4j/graphql/commit/28ffcf88d0b5026eb2f3cce756b762fc9d025811), [`0f52cf7e`](https://github.com/neo4j/graphql/commit/0f52cf7e360da1c9e68a8d63c81f1c35a66679f4), [`381c4061`](https://github.com/neo4j/graphql/commit/381c40610766f9eb6c938ddba424e44e3382f103), [`52f755b0`](https://github.com/neo4j/graphql/commit/52f755b0a5ecda6f8356a61e83591c7c00b1e30e), [`1c7987b5`](https://github.com/neo4j/graphql/commit/1c7987b51b10fed565d92e9d74256f986800c2cf), [`de4756ca`](https://github.com/neo4j/graphql/commit/de4756caa7b5d6baad4ea549e7a7652dabfa89fc)]:
  * @neo4j/graphql@3.6.0

## 3.5.1

### Patch Changes

* Updated dependencies [30af948c]
  * @neo4j/graphql@3.5.1
