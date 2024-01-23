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

import { SchemaComposer } from "graphql-compose";
import { NodeBuilder } from "../../../../tests/utils/builders/node-builder";
import { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { updateResolver } from "./update";

describe("Update resolver", () => {
    test("should return the correct; type, args and resolve", () => {
        const node = new NodeBuilder({
            name: "Movie",
            // @ts-ignore
            relationFields: [{}, {}],
        }).instance();
        const concreteEntity = new ConcreteEntity({
            name: "Movie",
            labels: ["Movie"],
            annotations: {},
            attributes: [],
            compositeEntities: [],
            description: undefined,
            relationships: [],
        });
        const concreteEntityAdapter = new ConcreteEntityAdapter(concreteEntity);

        const composer = new SchemaComposer();
        composer.createInputTC("MovieRelationInput");
        composer.createInputTC("MovieDeleteInput");
        composer.createInputTC("MovieConnectInput");
        composer.createInputTC("MovieDisconnectInput");
        composer.createInputTC("MovieConnectOrCreateInput");

        const result = updateResolver({ node, composer, concreteEntityAdapter });
        expect(result.type).toBe("UpdateMoviesMutationResponse!");
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({
            where: "MovieWhere",
            update: "MovieUpdateInput",
            connect: "MovieConnectInput",
            disconnect: "MovieDisconnectInput",
            create: "MovieRelationInput",
            delete: "MovieDeleteInput",
            connectOrCreate: "MovieConnectOrCreateInput",
        });
    });
    test("should return fewer fields based on number of InputTCs created", () => {
        const node = new NodeBuilder({
            name: "Movie",
            // @ts-ignore
            relationFields: [{}, {}],
        }).instance();
        const concreteEntity = new ConcreteEntity({
            name: "Movie",
            labels: ["Movie"],
            annotations: {},
            attributes: [],
            compositeEntities: [],
            description: undefined,
            relationships: [],
        });
        const concreteEntityAdapter = new ConcreteEntityAdapter(concreteEntity);

        const composer = new SchemaComposer();
        composer.createInputTC("MovieConnectInput");
        composer.createInputTC("MovieDisconnectInput");

        const result = updateResolver({ node, composer, concreteEntityAdapter });
        expect(result.type).toBe("UpdateMoviesMutationResponse!");
        expect(result.resolve).toBeInstanceOf(Function);

        expect(result.args).not.toMatchObject({
            where: "MovieWhere",
            update: "MovieUpdateInput",
            connect: "MovieConnectInput",
            disconnect: "MovieDisconnectInput",
            create: "MovieRelationInput",
            delete: "MovieDeleteInput",
            connectOrCreate: "MovieConnectOrCreateInput",
        });
        expect(result.args).toMatchObject({
            where: "MovieWhere",
            update: "MovieUpdateInput",
            connect: "MovieConnectInput",
            disconnect: "MovieDisconnectInput",
        });
    });
});
