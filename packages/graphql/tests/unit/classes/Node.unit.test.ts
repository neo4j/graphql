/* eslint-disable @typescript-eslint/ban-ts-comment */
import { describe, test, expect } from "@jest/globals";
import Node, { NodeConstructor } from "../../../src/classes/Node";

describe("Node", () => {
    test("should construct", () => {
        // @ts-ignore
        const input: NodeConstructor = {
            name: "Movie",
            cypherFields: [],
            enumFields: [],
            primitiveFields: [],
            scalarFields: [],
            dateTimeFields: [],
            unionFields: [],
            interfaceFields: [],
            objectFields: [],
            interfaces: [],
            otherDirectives: [],
            pointFields: [],
            relationFields: [],
        };

        // @ts-ignore
        expect(new Node(input)).toMatchObject({ name: "Movie" });
    });
});
