import { int } from "neo4j-driver";
import serialize from "../../../src/neo4j/serialize";

describe("serialize", () => {
    test("should convert neo4j object to normal object", () => {
        const obj = {
            number: { int: int(1) },
        };

        const result = serialize(obj);

        expect(result).toMatchObject({ number: { int: 1 } });
    });

    test("should convert nested neo4j object to normal object", () => {
        const obj = {
            number: { int: int(1), nestedNumber: [{ number: [{ number: { int: int(10) } }] }] },
        };

        const result = serialize(obj);

        expect(result).toMatchObject({
            number: { int: 1, nestedNumber: [{ number: [{ number: { int: 10 } }] }] },
        });
    });
});
