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

import createUpdateAndParams from "./create-update-and-params";
import { Neo4jGraphQL } from "../classes";
import { Context } from "../types";
import { trimmer } from "../utils";
import { NodeBuilder } from "../../tests/utils/builders/node-builder";

describe("createUpdateAndParams", () => {
    test("should return the correct update and params", () => {
        const idField = {
            fieldName: "id",
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
        };

        const node = new NodeBuilder({
            name: "Movie",
            primitiveFields: [idField],
        }).instance();

        // @ts-ignore
        const neo4jgraphql: Neo4jGraphQL = {
            nodes: [node],
        };

        // @ts-ignore
        const context: Context = { neo4jgraphql };

        const result = createUpdateAndParams({
            updateInput: { id: "new" },
            node,
            context,
            varName: "this",
            parentVar: "this",
            withVars: ["this"],
            parameterPrefix: "this",
        });

        expect(trimmer(result[0])).toEqual(
            trimmer(`
                SET this.id = $this_update_id
            `)
        );

        expect(result[1]).toMatchObject({
            this_update_id: "new",
        });
    });
});
