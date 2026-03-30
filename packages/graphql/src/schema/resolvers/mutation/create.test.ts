/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { createResolver } from "./create";

describe("Create resolver", () => {
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

        const result = createResolver({ concreteEntityAdapter });
        expect(result.type).toBe("CreateMoviesMutationResponse!");
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({
            input: "[MovieCreateInput!]!",
        });
    });
});
