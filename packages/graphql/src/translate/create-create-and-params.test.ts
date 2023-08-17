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
import type { Neo4jGraphQL } from "../classes";
import { trimmer } from "../utils";
import { NodeBuilder } from "../../tests/utils/builders/node-builder";
import { ContextBuilder } from "../../tests/utils/builders/context-builder";
import { CallbackBucket } from "../classes/CallbackBucket";
import { Neo4jGraphQLSchemaModel } from "../schema-model/Neo4jGraphQLSchemaModel";
import { ConcreteEntity } from "../schema-model/entity/ConcreteEntity";

describe("createCreateAndParams", () => {
    test("should return the correct projection with 1 selection", () => {
        const input = {
            title: "some title",
        };

        const node = new NodeBuilder({
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
                    selectableOptions: {
                        onRead: true,
                        onAggregate: false,
                    },
                    settableOptions: {
                        onCreate: true,
                        onUpdate: true,
                    },
                    filterableOptions: {
                        byValue: true,
                        byAggregate: true,
                    },
                    otherDirectives: [],
                    arguments: [],
                },
            ],
            temporalFields: [],
            interfaceFields: [],
            objectFields: [],
            pointFields: [],
        }).instance();

        const context = new ContextBuilder({
            schemaModel: new Neo4jGraphQLSchemaModel({
                concreteEntities: [new ConcreteEntity({ name: "Movie", labels: ["Movie"] })],
                compositeEntities: [],
                operations: {},
                annotations: [],
            }),
        }).instance();

        const result = createCreateAndParams({
            input,
            node,
            callbackBucket: new CallbackBucket(context),
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
