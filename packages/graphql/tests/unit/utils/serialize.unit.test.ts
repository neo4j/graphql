import { int, DateTime as DateTimeType } from "neo4j-driver";
import { DateTime } from "neo4j-driver/lib/temporal-types";
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

    test("should convert JS dates into Neo4J dates", () => {
        const date = new Date();
        const dateTimeISO = date.toISOString();

        const obj = {
            datetime: date,
            dates: [date, date],
        };

        const result = serialize(obj);

        expect(result.datetime).toBeInstanceOf(DateTime);
        expect(result.dates[0]).toBeInstanceOf(DateTime);
        expect(result.dates[1]).toBeInstanceOf(DateTime);

        expect(new Date((result.datetime as DateTimeType).toString()).toISOString()).toEqual(dateTimeISO);
        expect(new Date((result.dates[0] as DateTimeType).toString()).toISOString()).toEqual(dateTimeISO);
        expect(new Date((result.dates[1] as DateTimeType).toString()).toISOString()).toEqual(dateTimeISO);
    });
});
