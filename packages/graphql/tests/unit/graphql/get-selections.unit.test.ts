/* eslint-disable @typescript-eslint/ban-ts-comment */
import { GraphQLResolveInfo } from "graphql";
import getSelections from "../../../src/graphql/get-selections";

describe("getSelections", () => {
    test("should return the selections", () => {
        const name = "NAME";

        const resolveInfo: GraphQLResolveInfo = {
            fieldNodes: [
                // @ts-ignore
                { name: { value: name }, selectionSet: { selections: [{ name: { value: "SELECTION" } }] } },
                // @ts-ignore
                { name: { value: "random" }, selectionSet: { selections: [{ name: { value: "RANDOM" } }] } },
            ],
            fieldName: name,
        };

        const args = getSelections(resolveInfo, name);

        // @ts-ignore
        expect(args).toMatchObject(resolveInfo.fieldNodes[0].selectionSet.selections);
    });
});
