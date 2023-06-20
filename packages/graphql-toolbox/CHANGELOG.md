# @neo4j/graphql-toolbox

## 2.0.0

### Major Changes

-   [#3520](https://github.com/neo4j/graphql/pull/3520) [`ecb370f9d`](https://github.com/neo4j/graphql/commit/ecb370f9d0896d4b1c1717a0a8aa96fa98f262fc) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Toolbox - major version bump to version 2.0.0

    A high-level overview of changes made:

    -   All the editors are now powered by [CodeMirror](https://codemirror.net/) version 6 and support all the features and functions from the previous version.
    -   On the query editor page we've introduced tabs to store several queries and mutations. Improved the solution for resizing the different editors (query, variables, and response).
    -   The favorites feature on the type definitions page has been updated. It's now possible to order favorites and download them individually.
    -   Large overhaul of the styling to align with the other Neo4j frontend products.

### Minor Changes

-   [#3506](https://github.com/neo4j/graphql/pull/3506) [`8f4af1641`](https://github.com/neo4j/graphql/commit/8f4af1641d21512c45ba97fc76738ac8bd9d1794) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Toolbox: updates look and feel of favorites and adds ability to sort and download snippets

### Patch Changes

-   [#3491](https://github.com/neo4j/graphql/pull/3491) [`4d6db92f9`](https://github.com/neo4j/graphql/commit/4d6db92f969d3eecc34aa837e8155e94eb37da5b) Thanks [@mjfwebb](https://github.com/mjfwebb)! - fix: Toolbox - Tabs no longer have scrollbars
    fix: Toolbox - DocExplorer no longer has a flash of an error when loading
    feat: Toolbox - The "Build Schema" button now shows a loading state
    fix: Toolbox - Tabs only have a close button when there is more than one tab

-   [#3481](https://github.com/neo4j/graphql/pull/3481) [`67800df06`](https://github.com/neo4j/graphql/commit/67800df065f402fea9693c1d44fc6de395b9cf94) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Toolbox - address several small editor issues

-   [#3518](https://github.com/neo4j/graphql/pull/3518) [`f386b950c`](https://github.com/neo4j/graphql/commit/f386b950ca791b128aac29acc7bc5b3225587742) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Toolbox - additional product tracking events for new UI elements

-   [#3498](https://github.com/neo4j/graphql/pull/3498) [`0be64e79d`](https://github.com/neo4j/graphql/commit/0be64e79da3c2ce33e288c6e1b5cd31e1157e28d) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Toolbox - clean-up after CodeMirror v6 integration

-   [#3487](https://github.com/neo4j/graphql/pull/3487) [`0c526615c`](https://github.com/neo4j/graphql/commit/0c526615c3fe3d519ea1a2f302b90cf1ba4451c7) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Toolbox - warning dialog when attempting to switch database

-   [#3504](https://github.com/neo4j/graphql/pull/3504) [`da8bd8799`](https://github.com/neo4j/graphql/commit/da8bd8799d57c31b2922d51e846c0055308f79c5) Thanks [@tbwiss](https://github.com/tbwiss)! - fix: Toolbox - right-hand sider overflow and font-family for components

## 1.6.0

### Minor Changes

-   [#3468](https://github.com/neo4j/graphql/pull/3468) [`0ad9cba5b`](https://github.com/neo4j/graphql/commit/0ad9cba5b9b26cdd28ccc1923a4901f0abfc3dab) Thanks [@mjfwebb](https://github.com/mjfwebb)! - Uprade Codemirror to version 6

### Patch Changes

-   [#3410](https://github.com/neo4j/graphql/pull/3410) [`f2375d4e2`](https://github.com/neo4j/graphql/commit/f2375d4e2437c80cc3b7f0dd2fe547357e5e3134) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Toolbox - replace custom-implemented components with NDL components

-   [#3480](https://github.com/neo4j/graphql/pull/3480) [`545b30481`](https://github.com/neo4j/graphql/commit/545b30481a33808af51ff30bef13946efddebc83) Thanks [@tbwiss](https://github.com/tbwiss)! - fix: Toolbox - editor height and scroll

-   [#3464](https://github.com/neo4j/graphql/pull/3464) [`4014842d5`](https://github.com/neo4j/graphql/commit/4014842d555b690b0e870f7a4e9b4cb62989729f) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Toolbox - replace view switcher with tabs

-   [#3447](https://github.com/neo4j/graphql/pull/3447) [`9146b1a6b`](https://github.com/neo4j/graphql/commit/9146b1a6b491108b739e2f45ca952c2dca68dce5) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Toolbox - tooltip with clickable link gets a larger area

-   [#3412](https://github.com/neo4j/graphql/pull/3412) [`a33b368c4`](https://github.com/neo4j/graphql/commit/a33b368c457c070cee305965fdf4347cf4f2e700) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Toolbox - top bar updates: Connection Menu, updated styles, Connection information

-   [#3407](https://github.com/neo4j/graphql/pull/3407) [`e2455956a`](https://github.com/neo4j/graphql/commit/e2455956a9d455fa4e262e2760183e3b9796ab2f) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Toolbox - introduce query editor tabs

-   [#3462](https://github.com/neo4j/graphql/pull/3462) [`ffabf14f4`](https://github.com/neo4j/graphql/commit/ffabf14f40cb2b8668bd73503ac754a58155d575) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Toolbox - login window styling and layout

-   Updated dependencies [[`baa787745`](https://github.com/neo4j/graphql/commit/baa787745f5fef2af6b29ba3b4722a51f94b1961), [`8c99be2fe`](https://github.com/neo4j/graphql/commit/8c99be2fe3ef5a831c8f043403dedf980cf84f86), [`b891355e5`](https://github.com/neo4j/graphql/commit/b891355e58de1c56df68ce528a0a814d5202cab3), [`0f32311ea`](https://github.com/neo4j/graphql/commit/0f32311ea685c996f35a62410a21ef1d9f495b46), [`5616aa662`](https://github.com/neo4j/graphql/commit/5616aa662256e416b8401c8e50be79db194dfb28), [`f19a57ca2`](https://github.com/neo4j/graphql/commit/f19a57ca236cb608c8138237751c4432ede6233f), [`1d5506525`](https://github.com/neo4j/graphql/commit/1d550652512331f3fc69bf3b5307fbcb3fd79aab), [`0a444662b`](https://github.com/neo4j/graphql/commit/0a444662b2ac986971076505fbb6c17aec4ea539), [`8c99be2fe`](https://github.com/neo4j/graphql/commit/8c99be2fe3ef5a831c8f043403dedf980cf84f86), [`cc7c8e6a9`](https://github.com/neo4j/graphql/commit/cc7c8e6a9ba5b880c971efbfcd36485c92948a6b), [`f4d691566`](https://github.com/neo4j/graphql/commit/f4d6915661ef5f18e0d5fa3bd1b96d3564d94ee8)]:
    -   @neo4j/graphql@3.21.0

## 1.5.6

### Patch Changes

-   [#3390](https://github.com/neo4j/graphql/pull/3390) [`ac54d6e3c`](https://github.com/neo4j/graphql/commit/ac54d6e3c522fac6198001bd9f8615f31fc73991) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Toolbox - refactor the query editor grid to use "useDragResize" from "@graphiql/react"

-   Updated dependencies [[`449d66fbd`](https://github.com/neo4j/graphql/commit/449d66fbddb061c40bfd3df10c8c12bf037960d7)]:
    -   @neo4j/graphql@3.20.1

## 1.5.5

### Patch Changes

-   Updated dependencies [[`6cce9ffe0`](https://github.com/neo4j/graphql/commit/6cce9ffe0605795be8e2e1990860d4ea0bd256ec), [`a39b22fc1`](https://github.com/neo4j/graphql/commit/a39b22fc1f8f1227cac5a7efbaab1d855062054e)]:
    -   @neo4j/graphql@3.20.0

## 1.5.4

### Patch Changes

-   Updated dependencies [[`cc08bcd8a`](https://github.com/neo4j/graphql/commit/cc08bcd8a07044e38380fada05893de980351644), [`dcfe28b49`](https://github.com/neo4j/graphql/commit/dcfe28b4912bb328a03caab48991f0903f000751), [`ce573b770`](https://github.com/neo4j/graphql/commit/ce573b7705a01caadcc1ad10984f85976451ca2c), [`43e189c14`](https://github.com/neo4j/graphql/commit/43e189c14853cd626e14b53338b4ef0ca7e489b8)]:
    -   @neo4j/graphql@3.19.0

## 1.5.3

### Patch Changes

-   [#3301](https://github.com/neo4j/graphql/pull/3301) [`8233928c6`](https://github.com/neo4j/graphql/commit/8233928c6942a085f7146b029370ede5baf0cd49) Thanks [@tbwiss](https://github.com/tbwiss)! - fix: Toolbox, show lint mark in editors

-   [#3296](https://github.com/neo4j/graphql/pull/3296) [`6de12788a`](https://github.com/neo4j/graphql/commit/6de12788a1e1b2748ebd8699f864d9b443c201bf) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Toolbox, update UI for schema options and constraint sidebar

-   [#3302](https://github.com/neo4j/graphql/pull/3302) [`f3b8e6780`](https://github.com/neo4j/graphql/commit/f3b8e6780d4450c5095feae8348ed2376bd02530) Thanks [@tbwiss](https://github.com/tbwiss)! - boyscouting: Toolbox, copyright information update

-   Updated dependencies [[`e8092aa85`](https://github.com/neo4j/graphql/commit/e8092aa855244f7da21bb82f874bfda534a6fa4b), [`99fe4b4b8`](https://github.com/neo4j/graphql/commit/99fe4b4b813538fa985111918bf6ffe2ef458f05)]:
    -   @neo4j/graphql@3.18.3

## 1.5.2

### Patch Changes

-   [#3189](https://github.com/neo4j/graphql/pull/3189) [`75c05b80d`](https://github.com/neo4j/graphql/commit/75c05b80d2353a581a56f34f7f492737a6bdf536) Thanks [@tbwiss](https://github.com/tbwiss)! - fix: Toolbox, Codemirror text selection visibility

-   Updated dependencies [[`a8aabfeca`](https://github.com/neo4j/graphql/commit/a8aabfecad39b371fa82d16ea00e1e45d4044d05), [`8657dff82`](https://github.com/neo4j/graphql/commit/8657dff8274ea3d3a4a42c18c8e81232748cbeff)]:
    -   @neo4j/graphql@3.18.2

## 1.5.1

### Patch Changes

-   Updated dependencies [[`cbc15970c`](https://github.com/neo4j/graphql/commit/cbc15970cd87e5cdcfbae40ce5bacf1fb819ade8)]:
    -   @neo4j/graphql@3.18.1

## 1.5.0

### Minor Changes

-   [#3150](https://github.com/neo4j/graphql/pull/3150) [`98dd592a9`](https://github.com/neo4j/graphql/commit/98dd592a90c134605b88e8a28eeeccf0334f321e) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Toolbox, Docs explorer GraphiQL v2 component

### Patch Changes

-   [#3112](https://github.com/neo4j/graphql/pull/3112) [`4ec6e274a`](https://github.com/neo4j/graphql/commit/4ec6e274a58c50ce4bf674c84360c8eb53762956) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Toolbox, persistent store refactor

-   [#3128](https://github.com/neo4j/graphql/pull/3128) [`fb2497e24`](https://github.com/neo4j/graphql/commit/fb2497e24805898e89f0c640cb98a8fa614372bc) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Toolbox, cleanup components and use new NDL tooltip component

-   [#3086](https://github.com/neo4j/graphql/pull/3086) [`299ca1ec8`](https://github.com/neo4j/graphql/commit/299ca1ec847d742c3d21c6f5c8b5a745d6684fe9) Thanks [@tbwiss](https://github.com/tbwiss)! - fix: Toolbox, on load selection of database

-   Updated dependencies [[`7a2f2acc4`](https://github.com/neo4j/graphql/commit/7a2f2acc434d1996a4b3785416acb0c46ad7f199), [`ce5fb9eb3`](https://github.com/neo4j/graphql/commit/ce5fb9eb36a08dde95de605b49f842876b1c1515)]:
    -   @neo4j/graphql@3.18.0

## 1.4.13

### Patch Changes

-   Updated dependencies [[`ff99e317c`](https://github.com/neo4j/graphql/commit/ff99e317cff519b1ae26bd52c70b2d89ac923512), [`b6e4ebdc6`](https://github.com/neo4j/graphql/commit/b6e4ebdc62770951e333893c8f9562a2c9cbb99f), [`0ce8bcf4b`](https://github.com/neo4j/graphql/commit/0ce8bcf4b7b021e341496cde8b10140f00d47c84), [`39abf6591`](https://github.com/neo4j/graphql/commit/39abf65915bb100baab15f3e838b899152109e63), [`03141c81e`](https://github.com/neo4j/graphql/commit/03141c81e38e85bc6499231ae90a19e3fbdb17c3)]:
    -   @neo4j/graphql@3.17.2

## 1.4.12

### Patch Changes

-   Updated dependencies [[`56d126238`](https://github.com/neo4j/graphql/commit/56d1262389ff38522d7b9c3964e878415994b1fa), [`cfe96e713`](https://github.com/neo4j/graphql/commit/cfe96e713ea54e6c670d7fe0dc535e7065b81d9c), [`8e41a724a`](https://github.com/neo4j/graphql/commit/8e41a724a3abae1fa63fb5cd4cc1cf7a08e124d1), [`eaf16062c`](https://github.com/neo4j/graphql/commit/eaf16062c9a27eacdea53de87423b726bef7bed6), [`514bb64b6`](https://github.com/neo4j/graphql/commit/514bb64b6c22e886b3d8c06fc48b968af86bd421), [`99985018e`](https://github.com/neo4j/graphql/commit/99985018e6894d827efbfe1fa5fad6cc177594eb)]:
    -   @neo4j/graphql@3.17.1

## 1.4.11

### Patch Changes

-   Updated dependencies [[`6f0d9c06d`](https://github.com/neo4j/graphql/commit/6f0d9c06d9b34d30211bdf703bb0b26844033179), [`a0d4dc4cf`](https://github.com/neo4j/graphql/commit/a0d4dc4cf5d007235be3c7e36202aea9d39b6542), [`6421735f0`](https://github.com/neo4j/graphql/commit/6421735f014f0e2edacb1be7ba15c8819a1a0adb), [`cdbf768a0`](https://github.com/neo4j/graphql/commit/cdbf768a05323b15595fe26b5d047866f0f0c036), [`1902f903f`](https://github.com/neo4j/graphql/commit/1902f903f89453f2d17be909e2b05f1c12ac39a9), [`1a2101c33`](https://github.com/neo4j/graphql/commit/1a2101c33d00a738be26c57fa378d4a9e3bede41)]:
    -   @neo4j/graphql@3.17.0

## 1.4.10

### Patch Changes

-   Updated dependencies [[`0fe3a6853`](https://github.com/neo4j/graphql/commit/0fe3a68536e0cc5ec2cdd05057d038ca38358ff8), [`79ef38c5d`](https://github.com/neo4j/graphql/commit/79ef38c5dd43da19a64b0e7c25019209e19415f3)]:
    -   @neo4j/graphql@3.16.1

## 1.4.9

### Patch Changes

-   Updated dependencies [[`29e1d659a`](https://github.com/neo4j/graphql/commit/29e1d659aa7c48c73e6f19ed37bff320bff4dfeb), [`022861de2`](https://github.com/neo4j/graphql/commit/022861de2e1d69f8b56444b1c92308b2365e599c), [`8859980f9`](https://github.com/neo4j/graphql/commit/8859980f93598212fb226aa0172a0f0091965801), [`a270243bb`](https://github.com/neo4j/graphql/commit/a270243bb3baaa0abadeb395fff5b0036a754c7b), [`c2eaff8ef`](https://github.com/neo4j/graphql/commit/c2eaff8ef94b8cc6297be1435131967ea8a71115), [`3fff70828`](https://github.com/neo4j/graphql/commit/3fff708284e95b4667be5094bbda6cf828a467a9), [`8db2a1e2c`](https://github.com/neo4j/graphql/commit/8db2a1e2ce8a2f8d3077663a6665e0e670652db1), [`44ce8a741`](https://github.com/neo4j/graphql/commit/44ce8a74154182fca7ce6cf269bcd0009e61e34b), [`6d2ba44d4`](https://github.com/neo4j/graphql/commit/6d2ba44d49a043bf4aed5311e368cf0c30719745), [`14df1f827`](https://github.com/neo4j/graphql/commit/14df1f8271323a9d320810f5a19c02e79a5b3d84), [`4f6d4ae97`](https://github.com/neo4j/graphql/commit/4f6d4ae97f1278d37e65a25a10561efdfdeb6bac)]:
    -   @neo4j/graphql@3.16.0
    -   @neo4j/introspector@1.0.3

## 1.4.8

### Patch Changes

-   Updated dependencies [[`f17f6b5b0`](https://github.com/neo4j/graphql/commit/f17f6b5b0259d26cf207a340be027b6c20ec2b81), [`343845b26`](https://github.com/neo4j/graphql/commit/343845b26b577f0126dd3d7f2c070c5d0d1e3bf3), [`6a784dd1f`](https://github.com/neo4j/graphql/commit/6a784dd1ffbaa8c901e04b67f62590545bdd4f5d), [`163cf903d`](https://github.com/neo4j/graphql/commit/163cf903d375222b8455733d7f6a45ae831dea25), [`3fd44b3ef`](https://github.com/neo4j/graphql/commit/3fd44b3ef08d6eebec3cb1dd51111af8bf4e9fb2), [`ef1822849`](https://github.com/neo4j/graphql/commit/ef182284930c8444c7205e2bc398ef17481e6279)]:
    -   @neo4j/graphql@3.15.0

## 1.4.7

### Patch Changes

-   Updated dependencies [[`785e99db7`](https://github.com/neo4j/graphql/commit/785e99db7c75276ea1380cbef68435fe02dc8049), [`6c38084c0`](https://github.com/neo4j/graphql/commit/6c38084c0f2513085babc6a71b5039adf4b5c7e2), [`788fe93ef`](https://github.com/neo4j/graphql/commit/788fe93ef4d52e8a4fd697ac7f134b0e523ea4de), [`ea1917a5a`](https://github.com/neo4j/graphql/commit/ea1917a5a751fe9df362e687cc1f4d9b353e588f), [`1f8dee357`](https://github.com/neo4j/graphql/commit/1f8dee357296956c90968d79a5a3e0e9343fe2f9), [`f19ef34d7`](https://github.com/neo4j/graphql/commit/f19ef34d7908539fdba6bebc5b2a76fc09cf46c1), [`3252f44d7`](https://github.com/neo4j/graphql/commit/3252f44d7d5453690f0aa0f35b9246a41ff5908b)]:
    -   @neo4j/graphql@3.14.2

## 1.4.6

### Patch Changes

-   Updated dependencies [[`95ecaf7c3`](https://github.com/neo4j/graphql/commit/95ecaf7c37b3e6e69bf025d49b5ad00ad44dcb39), [`05280d0f1`](https://github.com/neo4j/graphql/commit/05280d0f16792e8e004c732ab039152d4dd32707), [`26d8a0045`](https://github.com/neo4j/graphql/commit/26d8a00453b03fa14328bcc2f5f4685e7b5e3ba3), [`189352546`](https://github.com/neo4j/graphql/commit/18935254652240c1ad826c3c85a5be873c4dbd20), [`9243fb3af`](https://github.com/neo4j/graphql/commit/9243fb3afc0c04408bf78c1ba581856ccb0e51fc), [`95ecaf7c3`](https://github.com/neo4j/graphql/commit/95ecaf7c37b3e6e69bf025d49b5ad00ad44dcb39), [`95ecaf7c3`](https://github.com/neo4j/graphql/commit/95ecaf7c37b3e6e69bf025d49b5ad00ad44dcb39), [`1b2913803`](https://github.com/neo4j/graphql/commit/1b2913803880bd1e8e1f1b7f79262ae20b1585e3), [`cd4f57a5d`](https://github.com/neo4j/graphql/commit/cd4f57a5ddc67660f7c41fd67e2006e68a8a0e1d), [`88d2cdfc1`](https://github.com/neo4j/graphql/commit/88d2cdfc1265f8a45c384872d32704bf452d36df)]:
    -   @neo4j/graphql@3.14.1

## 1.4.5

### Patch Changes

-   Updated dependencies [[`9d9bea661`](https://github.com/neo4j/graphql/commit/9d9bea6611851dd3ae9912aa0eb29554ed2b0eb0), [`652ebcdba`](https://github.com/neo4j/graphql/commit/652ebcdbadf71c3e55989672eb1064b52b32828e)]:
    -   @neo4j/graphql@3.14.0

## 1.4.4

### Patch Changes

-   Updated dependencies [[`1bec3f95d`](https://github.com/neo4j/graphql/commit/1bec3f95d0f469c2a4e879b1904a4d1a4938207e), [`0d70b0704`](https://github.com/neo4j/graphql/commit/0d70b07049a0f4b2391240929aadc54f62eedc42), [`5d349e05c`](https://github.com/neo4j/graphql/commit/5d349e05c08ed655144b9919528ba66047f49443), [`638f3205a`](https://github.com/neo4j/graphql/commit/638f3205ab3b20eb69a7bb33e6c11685d3e53a51), [`2710165e0`](https://github.com/neo4j/graphql/commit/2710165e0bfd200a8755e1b94f363ee17258fcac)]:
    -   @neo4j/graphql@3.13.1

## 1.4.3

### Patch Changes

-   [#2482](https://github.com/neo4j/graphql/pull/2482) [`1a037d2c1`](https://github.com/neo4j/graphql/commit/1a037d2c12314a21d691dc22af35770083f317ec) Thanks [@tbwiss](https://github.com/tbwiss)! - fix: Toolbox set default product usage tracking state

-   [#2454](https://github.com/neo4j/graphql/pull/2454) [`4b8c17982`](https://github.com/neo4j/graphql/commit/4b8c17982b1dcd38996c57766c36a260d429bccf) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: the GraphQL Toolbox gets a Canny changelog widget

-   Updated dependencies [[`12ec721e6`](https://github.com/neo4j/graphql/commit/12ec721e66f7ce570b31be3341c625a48bda304f), [`b981c45f7`](https://github.com/neo4j/graphql/commit/b981c45f76753557c18b1152ad62f258d2bee7f7), [`c06ac56ae`](https://github.com/neo4j/graphql/commit/c06ac56ae84360dc19bccd4545334c8c65b1c768), [`e220f36e0`](https://github.com/neo4j/graphql/commit/e220f36e07bb27aeb5c787e7ebf5b09e7fba2afc), [`b624c7ace`](https://github.com/neo4j/graphql/commit/b624c7aced55493f9df1abcaca91b139713f4186), [`20aa9c05b`](https://github.com/neo4j/graphql/commit/20aa9c05be4c780493d536bc98335fb88d857b6a)]:
    -   @neo4j/graphql@3.13.0

## 1.4.2

### Patch Changes

-   Updated dependencies [[`82846ef0a`](https://github.com/neo4j/graphql/commit/82846ef0a5ac0c778d295970405626bed829cff3)]:
    -   @neo4j/graphql@3.12.2

## 1.4.1

### Patch Changes

-   [#2358](https://github.com/neo4j/graphql/pull/2358) [`e50eff933`](https://github.com/neo4j/graphql/commit/e50eff93369e6835b27aa11d17b93de88503720e) Thanks [@tbwiss](https://github.com/tbwiss)! - boyscouting: Use the window.neo4jDesktopAPI to fetch dbms information when the Neo4j GraphQL Toolbox is executed on Neo4j Desktop

-   [#2404](https://github.com/neo4j/graphql/pull/2404) [`305649c18`](https://github.com/neo4j/graphql/commit/305649c180047e8f931f2190dcd4939043342189) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Banner in Toolbox for GraphQLaaS interest redirect

-   Updated dependencies [[`d71ddb54d`](https://github.com/neo4j/graphql/commit/d71ddb54d811e280357bd37270b9f5cae0c600aa), [`35bbf3197`](https://github.com/neo4j/graphql/commit/35bbf3197ecd3ad576567189242036ac3ee07b57), [`f2a56c738`](https://github.com/neo4j/graphql/commit/f2a56c73854c60144ec2809b855cd52eb1288a43), [`d04699b50`](https://github.com/neo4j/graphql/commit/d04699b50f0dd50984ab6688743f4fe027d797a0), [`27dd34de7`](https://github.com/neo4j/graphql/commit/27dd34de7815824afa490667ce2484f017c823a3), [`f2799750a`](https://github.com/neo4j/graphql/commit/f2799750a0a1aeaecaf9ead5295483e5205ada62), [`9d0859b59`](https://github.com/neo4j/graphql/commit/9d0859b596be29d0e64f6531e2bf0c17325b9a34)]:
    -   @neo4j/graphql@3.12.1

## 1.4.0

### Minor Changes

-   [#2293](https://github.com/neo4j/graphql/pull/2293) [`4932b9752`](https://github.com/neo4j/graphql/commit/4932b9752b4c0819cfdd3e26dd14520034cae5b9) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Toolbox product usage tracking - events

### Patch Changes

-   [#2307](https://github.com/neo4j/graphql/pull/2307) [`965d8b7bc`](https://github.com/neo4j/graphql/commit/965d8b7bc003ddd49d3dd1d2c568dcd0c0e1f8f5) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: Toolbox - link to GraphQLaaS interest form

-   Updated dependencies [[`0faef6f33`](https://github.com/neo4j/graphql/commit/0faef6f3330d70126817f6496556f5ad85611ad9), [`8642d3d67`](https://github.com/neo4j/graphql/commit/8642d3d67882cda2a0e212bdcf4b56376d419509), [`3b06cafbc`](https://github.com/neo4j/graphql/commit/3b06cafbc9f8ac6bfe43997bdd8e9db784b3907b)]:
    -   @neo4j/graphql@3.12.0

## 1.3.1

### Patch Changes

-   Updated dependencies [[`2c6d986a1`](https://github.com/neo4j/graphql/commit/2c6d986a19061fd8bc7739a2dd4737e7828e20d0)]:
    -   @neo4j/graphql@3.11.1

## 1.3.0

### Minor Changes

-   [#2248](https://github.com/neo4j/graphql/pull/2248) [`1b5dc3695`](https://github.com/neo4j/graphql/commit/1b5dc3695501373acafcf483c7a9540d1fbda485) Thanks [@tbwiss](https://github.com/tbwiss)! - feat: GraphQL Toolbox product usage tracking - UX parts

### Patch Changes

-   Updated dependencies [[`8eff620b9`](https://github.com/neo4j/graphql/commit/8eff620b93d86d544d4594b69c5058a9092347c0), [`c769933cb`](https://github.com/neo4j/graphql/commit/c769933cba76d16c4f14b2c18aaf5c47415b05d9), [`44fc500eb`](https://github.com/neo4j/graphql/commit/44fc500ebbaff3f8cdfcc676bd2ef8cad2fd58ec), [`b37376e38`](https://github.com/neo4j/graphql/commit/b37376e38e13ab2ed6f0e0eeb99f2d9f17161fd7), [`5ce80724f`](https://github.com/neo4j/graphql/commit/5ce80724f4d45a38e5d4b5d0d369384a4599d51f), [`2c8f3ec37`](https://github.com/neo4j/graphql/commit/2c8f3ec37ce57f281972ddc107a9490392c482df), [`94512c90e`](https://github.com/neo4j/graphql/commit/94512c90e5e37601a4d260f1153ac043639ceb6f), [`74e6fee11`](https://github.com/neo4j/graphql/commit/74e6fee119c8f0c7d30384422e722754411135b9), [`4ee4d40ad`](https://github.com/neo4j/graphql/commit/4ee4d40ad5aca514ddc08091b2501bfa699294e9), [`e7bcf4f0b`](https://github.com/neo4j/graphql/commit/e7bcf4f0b69a75c10e0ee0a604fd35cab09fcfaf)]:
    -   @neo4j/graphql@3.11.0

## 1.2.5

### Patch Changes

-   Updated dependencies [[`23467c469`](https://github.com/neo4j/graphql/commit/23467c4699287c9d33c0a1004db83ddb9e7e606a)]:
    -   @neo4j/graphql@3.10.1

## 1.2.4

### Patch Changes

-   Updated dependencies [[`64b3d0777`](https://github.com/neo4j/graphql/commit/64b3d07776685400313603f57e274ad8e821968b), [`cad28dd1f`](https://github.com/neo4j/graphql/commit/cad28dd1f2f92fccf713beee600d2234c7c9709b), [`cad28dd1f`](https://github.com/neo4j/graphql/commit/cad28dd1f2f92fccf713beee600d2234c7c9709b), [`5a748dc32`](https://github.com/neo4j/graphql/commit/5a748dc326ff063a8d8db6c281d681a68b679ade), [`c4ced43c0`](https://github.com/neo4j/graphql/commit/c4ced43c01cdd0d86d60a68906c3e79d847c5394), [`7b8a73cbd`](https://github.com/neo4j/graphql/commit/7b8a73cbd3e6accaaa7d64daa35f25941a7022c1)]:
    -   @neo4j/graphql@3.10.0

## 1.2.3

### Patch Changes

-   Updated dependencies [[`28742a5bd`](https://github.com/neo4j/graphql/commit/28742a5bd77b21497300248d18ff23206e1ec66f), [`0c89c88ae`](https://github.com/neo4j/graphql/commit/0c89c88ae25bb6c06edac4adff43b47802f45ea1), [`fb1e2c93f`](https://github.com/neo4j/graphql/commit/fb1e2c93f41adeaa61cc458f20a5812472ed3e2c)]:
    -   @neo4j/graphql@3.9.0

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
