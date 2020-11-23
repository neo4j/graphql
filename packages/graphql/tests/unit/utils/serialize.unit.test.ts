import { int } from "neo4j-driver";
import serialize from "../../../src/utils/serialize";

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

    test("should preserve booleans", () => {
        const obj = {
            isTrue: true,
        };

        const result = serialize(obj);

        expect(result).toMatchObject({ isTrue: true });
    });
});
