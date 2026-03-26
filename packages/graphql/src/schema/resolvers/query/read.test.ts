/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { SchemaComposer } from "graphql-compose";
import { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { findResolver } from "./read";

describe("Read resolver", () => {
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

        const result = findResolver({
            entityAdapter: concreteEntityAdapter,
            composer: new SchemaComposer(),
            isLimitRequired: undefined,
        });
        expect(result.type).toBe(`[Movie!]!`);
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({
            where: `MovieWhere`,
        });
    });
});
