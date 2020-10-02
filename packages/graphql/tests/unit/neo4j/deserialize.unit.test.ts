import { int } from "neo4j-driver";
import deserialize from "../../../src/neo4j/deserialize";

describe("deserialize", () => {
    test("should deserialize neo4j object to normal object", () => {
        const obj = {
            number: { int: int(1) },
        };

        const result = deserialize(obj);

        expect(result).toMatchObject({ number: { int: 1 } });
    });

    test("should deserialize nested neo4j object to normal object", () => {
        const obj = {
            number: { int: int(1), nestedNumber: [{ number: [{ number: { int: int(10) } }] }] },
        };

        const result = deserialize(obj);

        expect(result).toMatchObject({
            number: { int: 1, nestedNumber: [{ number: [{ number: { int: 10 } }] }] },
        });
    });
});
