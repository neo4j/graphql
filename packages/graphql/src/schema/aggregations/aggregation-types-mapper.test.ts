/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { SchemaComposer } from "graphql-compose";
import { AggregationTypesMapper } from "./aggregation-types-mapper";

describe("AggregationTypesMapper", () => {
    let composer: SchemaComposer;
    let typesMapper: AggregationTypesMapper;

    beforeEach(() => {
        composer = new SchemaComposer();
        typesMapper = new AggregationTypesMapper(composer);
    });

    test("returns the correct type", () => {
        const aggregationType = typesMapper.getAggregationType("String");
        expect(aggregationType?.getTypeName()).toBe("StringAggregateSelection");
        expect(composer.get(aggregationType?.getTypeName())).toBeTruthy();
    });

    test("do not duplicate types", () => {
        const beforeType = composer.get("StringAggregateSelection");
        const typesMapper2 = new AggregationTypesMapper(composer);
        const aggregationType = typesMapper2.getAggregationType("String");

        expect(aggregationType?.getTypeName()).toBe("StringAggregateSelection");
        expect(composer.get(aggregationType?.getTypeName())).toBeTruthy();
        expect(beforeType).toEqual(aggregationType);
    });

    test("returns undefined for invalid type", () => {
        const aggregationType = typesMapper.getAggregationType("this is a lovely typeeee");
        expect(aggregationType).toBeUndefined();
    });
});
