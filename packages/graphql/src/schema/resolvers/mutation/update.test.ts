/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { updateResolver } from "./update";

describe("Update resolver", () => {
    test("should return the correct; type, args and resolve", () => {
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

        const result = updateResolver({ concreteEntityAdapter });
        expect(result.type).toBe("UpdateMoviesMutationResponse!");
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({
            where: "MovieWhere",
            update: "MovieUpdateInput",
        });
    });
    test("should return fewer fields based on number of InputTCs created", () => {
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

        const result = updateResolver({ concreteEntityAdapter });
        expect(result.type).toBe("UpdateMoviesMutationResponse!");
        expect(result.resolve).toBeInstanceOf(Function);

        expect(result.args).not.toMatchObject({
            where: "MovieWhere",
            update: "MovieUpdateInput",

            create: "MovieRelationInput",
            delete: "MovieDeleteInput",
        });
        expect(result.args).toMatchObject({
            where: "MovieWhere",
            update: "MovieUpdateInput",
        });
    });
});
