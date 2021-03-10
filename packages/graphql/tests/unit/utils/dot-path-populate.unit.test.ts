import { generate } from "randomstring";
import dotPathPopulate from "../../../src/utils/dot-path-populate";
import { Context } from "../../../src/classes";

describe("dotPathPopulate", () => {
    const graphQLContext = {
        some: {
            nested: {
                value: generate({
                    charset: "alphabetic",
                }),
            },
        },
    };

    const jwt = {
        some: {
            nested: {
                value: generate({
                    charset: "alphabetic",
                }),
            },
        },
    };

    // @ts-ignore
    const context = new Context({ driver: {}, graphQLContext, neoSchema: {} });
    // @ts-ignore
    context.getJWT = () => jwt;
    context.getJWTSafe = () => jwt;

    test("should populate $context value", () => {
        const pathStr = "$context.some.nested.value";
        const obj = { id1: pathStr, id2: pathStr, arr: [pathStr], obj: { key: pathStr } };
        const result = dotPathPopulate({ obj, context });
        const { value } = graphQLContext.some.nested;

        expect(result).toEqual({
            id1: value,
            id2: value,
            arr: [value],
            obj: {
                key: value,
            },
        });
    });

    test("should populate $jwt value", () => {
        const pathStr = "$jwt.some.nested.value";
        const obj = { id1: pathStr, id2: pathStr, arr: [pathStr], obj: { key: pathStr } };
        const result = dotPathPopulate({ obj, context });
        const { value } = jwt.some.nested;

        expect(result).toEqual({
            id1: value,
            id2: value,
            arr: [value],
            obj: {
                key: value,
            },
        });
    });

    test("should return the string if not found", () => {
        const pathStr = "$invalid.some.nested.value";

        const obj = { id1: pathStr, id2: pathStr, arr: [pathStr], obj: { key: pathStr } };

        const result = dotPathPopulate({ obj, context });

        expect(result).toEqual({
            id1: pathStr,
            id2: pathStr,
            arr: [pathStr],
            obj: { key: pathStr },
        });
    });
});
