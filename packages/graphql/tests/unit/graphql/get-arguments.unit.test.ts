/* eslint-disable @typescript-eslint/ban-ts-comment */
import { GraphQLResolveInfo } from "graphql";
import getArguments from "../../../src/graphql/get-arguments";

describe("getArguments", () => {
    test("should return the arguments", () => {
        const name = "NAME";

        const resolveInfo: GraphQLResolveInfo = {
            fieldNodes: [
                // @ts-ignore
                { name: { value: name }, arguments: [{ name: { value: "skip" } }] },
                // @ts-ignore
                { name: { value: "random" }, arguments: [{ name: { value: "limit" } }] },
            ],
            fieldName: name,
        };

        const args = getArguments(resolveInfo);

        // @ts-ignore
        expect(args).toMatchObject(resolveInfo.fieldNodes[0].arguments);
    });
});
