/* eslint-disable @typescript-eslint/ban-ts-comment */
import Node from "../../../src/classes/Node";

describe("Node", () => {
    test("should construct", () => {
        const input = {
            name: "Movie",
        };

        // @ts-ignore
        expect(new Node(input)).toMatchObject({ name: "Movie" });
    });
});
