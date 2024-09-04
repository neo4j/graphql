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

import type { DirectiveNode, ObjectTypeDefinitionNode } from "graphql";
import {
    DirectiveLocation,
    GraphQLBoolean,
    GraphQLDirective,
    GraphQLFloat,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
    Kind,
    parse,
} from "graphql";
import { ScalarOrEnumType } from "../../graphql/directives/arguments/scalars/ScalarOrEnum";
import { parseArguments, parseArgumentsFromUnknownDirective } from "./parse-arguments";

describe("parseArguments", () => {
    let testDirectiveDefinition: GraphQLDirective;

    beforeAll(() => {
        testDirectiveDefinition = new GraphQLDirective({
            name: "testDirective",
            locations: [DirectiveLocation.FIELD_DEFINITION],
            args: {
                booleanArgument: {
                    type: new GraphQLNonNull(GraphQLBoolean),
                    defaultValue: true,
                },
                intArgument: {
                    type: new GraphQLNonNull(GraphQLInt),
                    defaultValue: 1,
                },
                floatArgument: {
                    type: GraphQLFloat,
                    defaultValue: 3.0,
                },
                customScalar: {
                    type: ScalarOrEnumType,
                    defaultValue: "test",
                },
                customListScalar: {
                    type: new GraphQLList(ScalarOrEnumType),
                    defaultValue: ["test"],
                },
            },
        });
    });

    test("should parse arguments", () => {
        const typeDefs = `
     
            type User @node {
                name: String @testDirective(booleanArgument: false, intArgument: 2, floatArgument: 4.0, customScalar: "123", customListScalar: ["123"])
            }
        `;

        const definitions = parse(typeDefs).definitions;
        const user = definitions.find(
            (def) => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === "User"
        ) as ObjectTypeDefinitionNode;

        const userName = user.fields?.find((field) => field.name.value === "name");
        expect(userName).toBeDefined();

        const nameCoalesceUsage = userName?.directives?.find(
            (dir) => dir.name.value === "testDirective"
        ) as DirectiveNode;
        expect(nameCoalesceUsage).toBeDefined();

        const args = parseArguments(testDirectiveDefinition, nameCoalesceUsage);

        expect(args).toEqual({
            booleanArgument: false,
            intArgument: 2,
            floatArgument: 4.0,
            customScalar: "123",
            customListScalar: ["123"],
        });
    });

    test("should use default values", () => {
        const typeDefs = `
            type User @node {
                name: String @testDirective(booleanArgument: false, intArgument: 2)
            }
        `;

        const definitions = parse(typeDefs).definitions;
        const user = definitions.find(
            (def) => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === "User"
        ) as ObjectTypeDefinitionNode;

        const userName = user.fields?.find((field) => field.name.value === "name");
        expect(userName).toBeDefined();

        const nameCoalesceUsage = userName?.directives?.find(
            (dir) => dir.name.value === "testDirective"
        ) as DirectiveNode;
        expect(nameCoalesceUsage).toBeDefined();

        const args = parseArguments(testDirectiveDefinition, nameCoalesceUsage);

        expect(args).toEqual({
            booleanArgument: false,
            intArgument: 2,
            floatArgument: 3.0,
            customScalar: "test",
            customListScalar: ["test"],
        });
    });

    test("parseArgumentsFromUnknownDirective", () => {
        const typeDefs = `
            type User @node {
                name: String @testDirective(booleanArgument: false, intArgument: 2)
            }
        `;

        const definitions = parse(typeDefs).definitions;
        const user = definitions.find(
            (def) => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === "User"
        ) as ObjectTypeDefinitionNode;

        const userName = user.fields?.find((field) => field.name.value === "name");
        expect(userName).toBeDefined();

        const nameCoalesceUsage = userName?.directives?.find(
            (dir) => dir.name.value === "testDirective"
        ) as DirectiveNode;
        expect(nameCoalesceUsage).toBeDefined();

        const args = parseArgumentsFromUnknownDirective(nameCoalesceUsage);

        expect(args).toEqual({ booleanArgument: false, intArgument: 2 });
    });
});
