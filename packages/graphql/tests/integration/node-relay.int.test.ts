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

import { parseGraphQLSDL } from "@graphql-tools/utils";
import { Driver } from "neo4j-driver";
import { FieldDefinitionNode, graphql, ObjectTypeDefinitionNode, printSchema } from "graphql";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("nodes for Relay", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should throw an error if user attempts to define a type for 'Node'", () => {
        const typeDefs = `
      type Node {
        id: ID
        title: String!
      }
    `;
        expect(
            () =>
                new Neo4jGraphQL({
                    typeDefs,
                })
        ).toThrow(
            "Type name `Node` reserved to support the node interface. See https://relay.dev/docs/guides/graphql-server-specification"
        );
    });

    test("should throw an error if user attempts to define an interface for `Node`", () => {
        const typeDefs = `
      interface Node {
        id: ID
        title: String!
      }

      type Movie implements Node {
        id: ID
        title: String!
      }
    `;

        expect(() => new Neo4jGraphQL({ typeDefs })).toThrow(
            "Interface name `Node` reserved to support the node interface. See https://relay.dev/docs/guides/graphql-server-specification"
        );
    });

    test("should require the implementing type to use the `@id` directive", () => {
        const typeDefs = `
      type Movie implements Node {
        id: ID!
        title: String!
      }
    `;

        expect(() => new Neo4jGraphQL({ typeDefs })).toThrow("type Movie does not implement interface Node correctly");
    });

    test("should not throw if the `Node` interface is implemented properly", () => {
        const typeDefs = `
      type Movie implements Node {
        id: ID! @id
        title: String!
      }
    `;

        expect(() => new Neo4jGraphQL({ typeDefs })).not.toThrow();
    });

    test("should add a global node query to the schema", () => {
        const typeDefs = `
      type Movie implements Node {
        id: ID! @id
        title: String!
      }
    `;

        const { schema } = new Neo4jGraphQL({ typeDefs });

        const printed = printSchema(schema);

        const transformed = parseGraphQLSDL("test.graphql", printed, { noLocation: true });

        const queryField = transformed.document.definitions.find(
            (x): x is ObjectTypeDefinitionNode => "name" in x && x.name?.value === "Query"
        );

        const nodeQuery = queryField?.fields?.find(
            (x): x is FieldDefinitionNode => "name" in x && x.name?.value === "node"
        );

        expect(nodeQuery).toBeTruthy();
    });

    test("should add a typeResolver for each type implementing node", async () => {
        const typeDefs = `
      type Movie implements Node {
        id: ID! @id
        title: String!
      }
      type Actor implements Node {
        id: ID! @id
        name: String!
      }
    `;

        const { schema } = new Neo4jGraphQL({ typeDefs });

        const source = `
      mutation {
        createMovies(
          input: [
            {
              title: "Mad Max: Fury Road",
            }
          ]
        ) {
          movies {
            id
            title
          }
        }
      }
    `;

        const result = await graphql({
            schema,
            source,
            contextValue: { driver },
            variableValues: {},
        });

        expect(result.errors).toBeFalsy();
        const id = result.data?.createMovies.movies[0].id;
        expect(id).toBeTruthy();

        const query = `
      query Node($id: ID!) {
        node(id: $id) {
          ... on Movie {
            id
            title
          }
        }
      }
    `;

        const nodeResult = await graphql({
            schema,
            source: query,
            contextValue: { driver },
            variableValues: { id },
        });

        expect(nodeResult.errors).toBeFalsy();

        expect(nodeResult.data?.node).toEqual({
            id,
            title: "Mad Max: Fury Road",
        });
    });
});
