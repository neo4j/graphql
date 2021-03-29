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

import createCreateAndParams from "./create-create-and-params";
import { Neo4jGraphQL, Context, Node } from "../classes";
import { trimmer } from "../utils";

describe("createCreateAndParams", () => {
    test("should return the correct projection with 1 selection", () => {
        const input = {
            title: "some title",
        };

        // @ts-ignore
        const node: Node = {
            name: "Movie",
            relationFields: [],
            cypherFields: [],
            enumFields: [],
            scalarFields: [],
            primitiveFields: [
                {
                    fieldName: "title",
                    typeMeta: {
                        name: "String",
                        array: false,
                        required: false,
                        pretty: "String",
                        input: {
                            where: {
                                type: "String",
                                pretty: "String",
                            },
                            create: {
                                type: "String",
                                pretty: "String",
                            },
                            update: {
                                type: "String",
                                pretty: "String",
                            },
                        },
                    },
                    otherDirectives: [],
                    arguments: [],
                },
            ],
            dateTimeFields: [],
            interfaceFields: [],
            objectFields: [],
            pointFields: [],
        };

        // @ts-ignore
        const neoSchema: Neo4jGraphQL = {
            nodes: [node],
        };

        // @ts-ignore
        const context = new Context({ neoSchema });

        const result = createCreateAndParams({
            input,
            node,
            context,
            varName: "this0",
            withVars: ["this0"],
        });

        expect(trimmer(result[0])).toEqual(
            trimmer(`
                CREATE (this0:Movie)
                SET this0.title = $this0_title
            `)
        );

        expect(result[1]).toMatchObject({
            this0_title: "some title",
        });
    });
});
