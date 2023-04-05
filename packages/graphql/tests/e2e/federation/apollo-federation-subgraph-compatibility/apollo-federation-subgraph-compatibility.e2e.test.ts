/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { gql } from "graphql-tag";
import { GatewayServer } from "../setup/gateway-server";
import type { Server } from "../setup/server";
import { TestSubgraph } from "../setup/subgraph";
import { SubgraphServer } from "../setup/subgraph-server";
import { Neo4j } from "../setup/neo4j";
import { schema as inventory } from "./subgraphs/inventory";
import { schema as users } from "./subgraphs/users";
import { productsRequest, routerRequest } from "./utils/client";
import { stripIgnoredCharacters } from "graphql";

describe("Tests copied from https://github.com/apollographql/apollo-federation-subgraph-compatibility", () => {
    let inventoryServer: Server;
    let productsServer: Server;
    let usersServer: Server;

    let gatewayServer: Server;

    let neo4j: Neo4j;

    beforeAll(async () => {
        const products = gql`
            extend schema
                @link(
                    url: "https://specs.apollo.dev/federation/v2.0"
                    import: [
                        "@extends"
                        "@external"
                        "@inaccessible"
                        "@key"
                        "@override"
                        "@provides"
                        "@requires"
                        "@shareable"
                        "@tag"
                    ]
                )

            type Product @key(fields: "id") @key(fields: "sku package") @key(fields: "sku variation { id }") {
                id: ID!
                sku: String
                package: String
                variation: ProductVariation @relationship(type: "HAS_VARIATION", direction: OUT)
                dimensions: ProductDimension @relationship(type: "HAS_DIMENSIONS", direction: OUT)
                createdBy: User
                    @provides(fields: "totalProductsCreated")
                    @relationship(type: "CREATED_BY", direction: OUT)
                notes: String @tag(name: "internal")
                research: [ProductResearch!]! @relationship(type: "HAS_RESEARCH", direction: OUT)
            }

            type DeprecatedProduct @key(fields: "sku package") {
                sku: String!
                package: String!
                reason: String
                createdBy: User @relationship(type: "CREATED_BY", direction: OUT)
            }

            type ProductVariation {
                id: ID!
            }

            type ProductResearch @key(fields: "study { caseNumber }") {
                study: CaseStudy! @relationship(type: "HAS_STUDY", direction: OUT)
                outcome: String
            }

            type CaseStudy {
                caseNumber: ID!
                description: String
            }

            type ProductDimension @shareable {
                size: String
                weight: Float
                unit: String @inaccessible
            }

            type Query {
                product(id: ID!): Product
                    @cypher(
                        statement: "MATCH (product:Product) WHERE product.id = $id RETURN product"
                        columnName: "product"
                    )
                deprecatedProduct(sku: String!, package: String!): DeprecatedProduct
                    @deprecated(reason: "Use product query instead")
                    @cypher(
                        statement: "MATCH (product:DeprecatedProduct) WHERE product.sku = $sku AND product.package = $package = $id RETURN product"
                        columnName: "product"
                    )
            }

            # should be extends
            type User @key(fields: "email") @extends {
                averageProductsCreatedPerYear: Int @requires(fields: "totalProductsCreated yearsOfEmployment")
                email: ID! @external
                name: String @override(from: "users")
                totalProductsCreated: Int @external
                yearsOfEmployment: Int! @external
            }
        `;

        neo4j = new Neo4j();
        await neo4j.init();

        inventoryServer = new SubgraphServer(inventory, 4010);
        usersServer = new SubgraphServer(users, 4012);

        const productsSubgraph = new TestSubgraph({
            typeDefs: products,
            resolvers: {
                User: {
                    averageProductsCreatedPerYear: (_source, _args, context) => {
                        return Math.floor(
                            context.resolveTree.args.representations[0].totalProductsCreated /
                                context.resolveTree.args.representations[0].yearsOfEmployment
                        );
                    },
                },
            },
            driver: neo4j.driver,
        });

        const productsSchema = await productsSubgraph.getSchema();

        productsServer = new SubgraphServer(productsSchema, 4011);

        const [inventoryUrl, productsUrl, usersUrl] = await Promise.all([
            inventoryServer.start(),
            productsServer.start(),
            usersServer.start(),
        ]);

        gatewayServer = new GatewayServer(
            [
                { name: "inventory", url: inventoryUrl },
                { name: "products", url: productsUrl },
                { name: "users", url: usersUrl },
            ],
            4013
        );

        await gatewayServer.start();

        await neo4j.executeWrite(
            `
            CREATE (dimension:ProductDimension { size: "small", weight: 1.0, unit: "kg" })

            CREATE (user:User { email: "support@apollographql.com", name: "Jane Smith", totalProductsCreated: 1337, yearsOfEmployment: 10 })

            CREATE (:DeprecatedProduct { sku: "apollo-federation-v1", package: "@apollo/federation-v1", reason: "Migrate to Federation V2" })-[:CREATED_BY]->(user)

            CREATE (p1:Product { id: "apollo-federation", sku: "federation", package: "@apollo/federation" })
            CREATE (p1)-[:HAS_VARIATION]->(:ProductVariation { id: "OSS" })
            CREATE (p1)-[:HAS_DIMENSIONS]->(dimension)
            CREATE (p1)-[:HAS_RESEARCH]->(:ProductResearch)-[:HAS_STUDY]->(:CaseStudy { caseNumber: "1234", description: "Federation Study" })
            CREATE (p1)-[:CREATED_BY]->(user)

            CREATE (p2:Product { id: "apollo-studio", sku: "studio", package: "" })
            CREATE (p2)-[:HAS_VARIATION]->(:ProductVariation { id: "platform" })
            CREATE (p2)-[:HAS_DIMENSIONS]->(dimension)
            CREATE (p2)-[:HAS_RESEARCH]->(:ProductResearch)-[:HAS_STUDY]->(:CaseStudy { caseNumber: "1235", description: "Studio Study" })
            CREATE (p2)-[:CREATED_BY]->(user)
            `
        );
    });

    afterAll(async () => {
        await gatewayServer.stop();
        await Promise.all([inventoryServer.stop(), productsServer.stop(), usersServer.stop()]);
        await neo4j.executeWrite(
            `
          MATCH (dimension:ProductDimension)
          MATCH (v:ProductVariation)
          MATCH (u:User)
          MATCH (d:DeprecatedProduct)
          MATCH (p:Product)
          MATCH (r:ProductResearch)
          MATCH (c:CaseStudy)
          DETACH DELETE dimension, v, u, d, p, r, c
          `
        );
        await neo4j.close();
    });

    test("ftv1", async () => {
        const resp = await productsRequest(
            {
                query: `query { __typename }`,
            },
            { "apollo-federation-include-trace": "ftv1" }
        );

        expect(resp).toEqual({
            data: {
                __typename: "Query",
            },
            extensions: {
                ftv1: expect.any(String),
            },
        });
    });

    describe("@inaccessible", () => {
        it("should return @inaccessible directives in _service sdl", async () => {
            const response = await productsRequest({
                query: "query { _service { sdl } }",
            });

            const { sdl } = response.data._service;
            const normalizedSDL = stripIgnoredCharacters(sdl);
            expect(normalizedSDL).not.toContain("@federation__inaccessible");
            expect(normalizedSDL).toContain("unit:String@inaccessible");
        });

        it("should be able to query @inaccessible fields via the products schema directly", async () => {
            const resp = await productsRequest({
                query: `
            query GetProduct($id: ID!) {
              product(id: $id) {
                dimensions {
                  unit
                }
              }
            }
          `,
                variables: { id: "apollo-federation" },
            });

            expect(resp).not.toHaveProperty("errors");
            expect(resp).toMatchObject({
                data: {
                    product: {
                        dimensions: {
                            unit: "kg",
                        },
                    },
                },
            });
        });
    });

    describe("@key single", () => {
        test("applies single field @key on User", async () => {
            const serviceSDLQuery = await productsRequest({
                query: "query { _service { sdl } }",
            });

            const { sdl } = serviceSDLQuery.data._service;
            const normalizedSDL = stripIgnoredCharacters(sdl);
            expect(normalizedSDL).toMatch(
                /type User(@extends|@federation__extends)?(@key|@federation__key)\(fields:"email"( resolvable:true)?\)/
            );
        });

        test("resolves single field @key on User", async () => {
            const resp = await productsRequest({
                query: `#graphql
          query ($representations: [_Any!]!) {
            _entities(representations: $representations) {
              ...on User { email name }
            }
          }
        `,
                variables: {
                    representations: [{ __typename: "User", email: "support@apollographql.com" }],
                },
            });

            expect(resp).not.toHaveProperty("errors");
            expect(resp).toMatchObject({
                data: {
                    _entities: [
                        {
                            email: "support@apollographql.com",
                            name: "Jane Smith",
                        },
                    ],
                },
            });
        });
    });

    describe("@key multiple", () => {
        test("applies multiple field @key on DeprecatedProduct", async () => {
            const serviceSDLQuery = await productsRequest({
                query: "query { _service { sdl } }",
            });

            const { sdl } = serviceSDLQuery.data._service;
            const normalizedSDL = stripIgnoredCharacters(sdl);
            expect(normalizedSDL).toMatch(/type DeprecatedProduct(@key|@federation__key)\(fields:"sku package"/);
        });

        test("resolves multiple field @key on DeprecatedProduct", async () => {
            const resp = await productsRequest({
                query: `#graphql
          query ($representations: [_Any!]!) {
            _entities(representations: $representations) {
              ...on DeprecatedProduct { sku package reason }
            }
          }
        `,
                variables: {
                    representations: [
                        {
                            __typename: "DeprecatedProduct",
                            sku: "apollo-federation-v1",
                            package: "@apollo/federation-v1",
                        },
                    ],
                },
            });

            expect(resp).not.toHaveProperty("errors");
            expect(resp).toMatchObject({
                data: {
                    _entities: [
                        {
                            sku: "apollo-federation-v1",
                            package: "@apollo/federation-v1",
                            reason: "Migrate to Federation V2",
                        },
                    ],
                },
            });
        });
    });

    describe("@key composite", () => {
        test("applies composite object @key on ProductResearch", async () => {
            const serviceSDLQuery = await productsRequest({
                query: "query { _service { sdl } }",
            });

            const { sdl } = serviceSDLQuery.data._service;
            const normalizedSDL = stripIgnoredCharacters(sdl);
            expect(normalizedSDL).toMatch(/type ProductResearch(@key|@federation__key)\(fields:"study { caseNumber }"/);
        });

        test("resolves composite object @key on ProductResearch", async () => {
            const resp = await productsRequest({
                query: `#graphql
          query ($representations: [_Any!]!) {
            _entities(representations: $representations) {
              ...on ProductResearch { study { caseNumber description } }
            }
          }
        `,
                variables: {
                    representations: [
                        {
                            __typename: "ProductResearch",
                            study: {
                                caseNumber: "1234",
                            },
                        },
                    ],
                },
            });

            expect(resp).not.toHaveProperty("errors");
            expect(resp).toMatchObject({
                data: {
                    _entities: [
                        {
                            study: {
                                caseNumber: "1234",
                                description: "Federation Study",
                            },
                        },
                    ],
                },
            });
        });
    });

    describe("repeatable @key", () => {
        test("applies repeatable @key directive on Product", async () => {
            const serviceSDLQuery = await productsRequest({
                query: "query { _service { sdl } }",
            });

            const { sdl } = serviceSDLQuery.data._service;
            const normalizedSDL = stripIgnoredCharacters(sdl);
            expect(normalizedSDL).toMatch(
                /type Product.*(@key|@federation__key)\(fields:"id"( resolvable:true)?\).*\{/
            );
            // need to end regex with unique field in Product as otherwise we can match against DeprecatedProduct key
            expect(normalizedSDL).toMatch(
                /type Product.*(@key|@federation__key)\(fields:"sku package"( resolvable:true)?\).*variation/
            );
            expect(normalizedSDL).toMatch(
                /type Product.*(@key|@federation__key)\(fields:"sku variation { id }"( resolvable:true)?\).*\{/
            );
        });

        test("resolves multiple @key directives on Product", async () => {
            const entitiesQuery = await productsRequest({
                query: `#graphql
          query ($representations: [_Any!]!) {
            _entities(representations: $representations) {
              ...on Product { id sku }
            }
          }
        `,
                variables: {
                    representations: [
                        {
                            __typename: "Product",
                            id: "apollo-federation",
                        },
                        {
                            __typename: "Product",
                            sku: "federation",
                            package: "@apollo/federation",
                        },
                        {
                            __typename: "Product",
                            sku: "studio",
                            variation: { id: "platform" },
                        },
                    ],
                },
            });

            expect(entitiesQuery).not.toHaveProperty("errors");
            expect(entitiesQuery).toMatchObject({
                data: {
                    _entities: [
                        {
                            id: "apollo-federation",
                            sku: "federation",
                        },
                        {
                            id: "apollo-federation",
                            sku: "federation",
                        },
                        {
                            id: "apollo-studio",
                            sku: "studio",
                        },
                    ],
                },
            });
        });
    });

    test("@link", async () => {
        const response = await productsRequest({
            query: "query { _service { sdl } }",
        });

        expect(response.data).toMatchObject({
            _service: {
                sdl: expect.stringContaining("@link"),
            },
        });

        const { sdl } = response.data._service;
        const normalizedSDL = stripIgnoredCharacters(sdl);

        const linksRegex = /@link\(([\s\S]+?)\)/g;
        // should have @link imports
        expect(linksRegex.test(normalizedSDL)).toBe(true);

        let fedLinkCount = 0;
        normalizedSDL.match(linksRegex)?.forEach((element) => {
            const urlRegex = /url:(".+?")/;
            // skip definitions
            if (urlRegex.test(element)) {
                const rawLink = element.match(urlRegex)?.[1] as string;

                const linkUrl = JSON.parse(rawLink);
                const linkUrlSpecVersionRegex = /https:\/\/specs.apollo.dev\/federation\/v(.+)/;
                // only verify federation spec @links
                if (linkUrlSpecVersionRegex.test(linkUrl)) {
                    fedLinkCount++;

                    const federationVersion = linkUrl.match(linkUrlSpecVersionRegex)[1];
                    // only federation v2.0 and v2.1 are supported
                    // eslint-disable-next-line jest/no-conditional-expect
                    expect(federationVersion).toMatch(/2\.0|2\.1/);

                    const linkImportsRegex = /import:\[(.+?)\]/;
                    if (linkImportsRegex.test(element)) {
                        // verify federation imports
                        const expected = [
                            "@composeDirective",
                            "@extends",
                            "@external",
                            "@inaccessible",
                            "@key",
                            "@override",
                            "@provides",
                            "@requires",
                            "@shareable",
                            "@tag",
                            "FieldSet",
                        ];

                        const linkImportsMatch = element.match(linkImportsRegex);
                        const linkImports = (linkImportsMatch?.[1] as string).split(" ");
                        linkImports?.forEach((importedElement) => {
                            if (!expected.includes(importedElement.replaceAll('"', ""))) {
                                // eslint-disable-next-line jest/no-conditional-expect
                                expect("").toBe("unexpected federation import ${element}");
                            }
                        });
                    }
                }
            }
        });

        if (fedLinkCount == 0) {
            // eslint-disable-next-line jest/no-conditional-expect
            expect("").toBe("missing federation spec @link imports");
        }

        if (fedLinkCount > 1) {
            // eslint-disable-next-line jest/no-conditional-expect
            expect("").toBe("schema @link imports multiple federation specs");
        }
    });

    describe("@override", () => {
        it("should return @override directives in _service sdl", async () => {
            const response = await productsRequest({
                query: "query { _service { sdl } }",
            });

            const { sdl } = response.data._service;
            expect(stripIgnoredCharacters(sdl)).toMatch(/(@override|@federation__override)\(from:"users"\)/);
        });

        it("should return overridden user name", async () => {
            const resp = await routerRequest({
                query: `
            query GetProduct($id: ID!) {
              product(id: $id) {
                createdBy {
                  name
                }
              }
            }
          `,
                variables: { id: "apollo-federation" },
            });

            expect(resp).not.toHaveProperty("errors");
            expect(resp).toMatchObject({
                data: {
                    product: {
                        createdBy: {
                            name: "Jane Smith",
                        },
                    },
                },
            });
        });
    });

    test("@provides", async () => {
        const resp = await productsRequest({
            query: `#graphql
          query ($id: ID!) {
            product(id: $id) {
              createdBy { email totalProductsCreated }
            }
          }`,
            variables: { id: "apollo-federation" },
        });

        expect(resp).not.toHaveProperty("errors");
        expect(resp).toMatchObject({
            data: {
                product: {
                    createdBy: {
                        email: "support@apollographql.com",
                        totalProductsCreated: expect.any(Number),
                    },
                },
            },
        });

        const totalProductsCreated: number = resp.data.product.createdBy.totalProductsCreated;
        expect(totalProductsCreated).not.toBe(4);
    });

    test("@requires", async () => {
        const resp = await routerRequest({
            query: `#graphql
          query ($id: ID!) {
            product(id: $id) { createdBy { averageProductsCreatedPerYear email } }
          }`,
            variables: { id: "apollo-federation" },
        });

        expect(resp).not.toHaveProperty("errors");
        expect(resp).toMatchObject({
            data: {
                product: {
                    createdBy: {
                        averageProductsCreatedPerYear: expect.any(Number),
                        email: "support@apollographql.com",
                    },
                },
            },
        });
    });

    describe("@shareable", () => {
        it("should return @shareable directives in _service sdl", async () => {
            const response = await productsRequest({
                query: "query { _service { sdl } }",
            });

            const { sdl } = response.data._service;
            expect(stripIgnoredCharacters(sdl)).toMatch(/type ProductDimension(@shareable|@federation__shareable)/);
        });

        it("should be able to resolve @shareable ProductDimension types", async () => {
            const resp = await routerRequest({
                query: `
            query GetProduct($id: ID!) {
              product(id: $id) {
                dimensions {
                  size
                  weight
                }
              }
            }
          `,
                variables: { id: "apollo-federation" },
            });

            expect(resp).not.toHaveProperty("errors");
            expect(resp).toMatchObject({
                data: {
                    product: {
                        dimensions: {
                            size: "small",
                            weight: 1,
                        },
                    },
                },
            });
        });
    });

    test("@tag", async () => {
        const response = await productsRequest({
            query: "query { _service { sdl } }",
        });

        const { sdl } = response.data._service;
        const normalizedSDL = stripIgnoredCharacters(sdl);
        expect(normalizedSDL).not.toContain("@federation__tag");
        expect(normalizedSDL).toContain('@tag(name:"internal")');
    });
});
