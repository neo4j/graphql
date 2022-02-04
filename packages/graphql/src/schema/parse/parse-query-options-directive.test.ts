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

/* eslint-disable-next-line import/no-extraneous-dependencies */
import { gql } from "apollo-server-core";
import * as neo4j from "neo4j-driver";
import { DirectiveNode, ObjectTypeDefinitionNode } from "graphql";
import parseQueryOptionsDirective from "./parse-query-options-directive";

describe("parseQueryOptionsDirective", () => {
    test("should throw error when default limit is less than or equal to 0", () => {
        [-10, -100, 0].forEach((i) => {
            const typeDefs = gql`
                type Movie @queryOptions(limit: {default: ${i}}) {
                    id: ID
                }
            `;

            const definition = typeDefs.definitions[0] as unknown as ObjectTypeDefinitionNode;
            const directive = (definition.directives || [])[0] as DirectiveNode;

            expect(() =>
                parseQueryOptionsDirective({
                    directive,
                    definition,
                })
            ).toThrow(
                `${definition.name.value} @queryOptions(limit: {default: ${i}}) invalid value: '${i}' try a number greater than 0`
            );
        });
    });

    test("should return correct object if default limit is undefined", () => {
        const typeDefs = gql`
            type Movie @queryOptions {
                id: ID
            }
        `;

        const definition = typeDefs.definitions[0] as unknown as ObjectTypeDefinitionNode;
        const directive = (definition.directives || [])[0] as DirectiveNode;

        const result = parseQueryOptionsDirective({
            directive,
            definition,
        });
        expect(result).toEqual({
            limit: {
                default: undefined,
            },
        });
    });

    test("should parse and return correct meta data", () => {
        const defaultLimit = 100;

        const typeDefs = gql`
                type Movie @queryOptions(limit: {default: ${defaultLimit}} ) {
                    id: ID
                }
            `;

        const definition = typeDefs.definitions[0] as unknown as ObjectTypeDefinitionNode;
        const directive = (definition.directives || [])[0] as DirectiveNode;

        const result = parseQueryOptionsDirective({
            directive,
            definition,
        });

        expect(result).toEqual({ limit: { default: neo4j.int(defaultLimit) } });
    });
});
