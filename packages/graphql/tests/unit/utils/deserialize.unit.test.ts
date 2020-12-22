import { int, DateTime as DateTimeType } from "neo4j-driver";
import { DateTime } from "neo4j-driver/lib/temporal-types";
import deserialize from "../../../src/utils/deserialize";

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
            number: {
                int: int(1),
                nestedNumber: [
                    {
                        number: [
                            {
                                number: {
                                    int: int(10),
                                },
                            },
                        ],
                    },
                ],
            },
        };

        const result = deserialize(obj);

        expect(result).toMatchObject({
            number: {
                int: 1,
                nestedNumber: [{ number: [{ number: { int: 10 } }] }],
            },
        });
    });

    test("should deserialize neo4j dates into ISO", () => {
        const dateTime: DateTimeType = new DateTime(1970, 1, 1, 0, 0, 0, 0, 0) as DateTimeType;
        const dateTimeISO = new Date(dateTime.toString()).toISOString();

        const obj = {
            date: dateTime,
            arrays: [dateTime, dateTime],
        };

        const result = deserialize(obj);

        expect(result.date).toMatch(dateTimeISO);
        expect(result.arrays[1]).toMatch(dateTimeISO);
        expect(result.arrays[1]).toMatch(dateTimeISO);
    });
});
