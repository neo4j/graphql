import { int } from "neo4j-driver";
import serialize from "../../../src/neo4j/serialize";

describe("serialize", () => {
    test("should serialize object to neo4j object", () => {
        const obj = {
            number: { int: 1 },
        };

        const result = serialize(obj);

        expect(result).toMatchObject({ number: { int: int(1) } });
    });

    test("should serialize nested object to neo4j object", () => {
        const obj = {
            number: { int: 1, nestedNumber: [{ number: [{ number: { int: 20 } }] }] },
        };

        const result = serialize(obj);

        expect(result).toMatchObject({
            number: { int: int(1), nestedNumber: [{ number: [{ number: { int: int(20) } }] }] },
        });
    });
});
