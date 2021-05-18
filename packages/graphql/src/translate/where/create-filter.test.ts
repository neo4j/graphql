import createFilter, { Operator } from "./create-filter";

describe("createFilter", () => {
    const left = "left";
    const right = "right";
    const notFilters = ["INCLUDES", "IN", "CONTAINS", "STARTS_WITH", "ENDS_WITH"];

    const validFilters = [
        ...Object.entries(Operator).map(([k, v]) => ({
            input: {
                left,
                operator: k,
                right,
            },
            expected: `${left} ${v} ${right}`,
        })),
        ...Object.entries(Operator)
            .filter(([k]) => notFilters.includes(k))
            .map(([k, v]) => ({
                input: {
                    left,
                    operator: k,
                    right,
                    not: true,
                },
                expected: `(NOT ${left} ${v} ${right})`,
            })),
    ];

    validFilters.forEach((valid) => {
        test(`should create filter ${valid.input.operator}`, () => {
            const filter = createFilter(valid.input);
            expect(filter).toBe(valid.expected);
        });
    });

    const invalidFilters = [
        {
            input: {
                left,
                operator: "UNKNOWN",
                right,
            },
            expectedErrorMessage: `Invalid filter operator UNKNOWN`,
        },
        ...Object.keys(Operator)
            .filter((k) => !notFilters.includes(k))
            .map((k) => ({
                input: {
                    left,
                    operator: k,
                    right,
                    not: true,
                },
                expectedErrorMessage: `Invalid filter operator NOT_${k}`,
            })),
    ];

    invalidFilters.forEach((invalid) => {
        test(`should throw an error for filter ${invalid.input.operator}`, () => {
            expect(() => createFilter(invalid.input)).toThrow(invalid.expectedErrorMessage);
        });
    });
});
