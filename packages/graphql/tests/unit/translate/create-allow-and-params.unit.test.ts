import { describe, test, expect } from "@jest/globals";
import { Auth, Node, Context } from "../../../src/classes";
import createAllowAndParams from "../../../src/translate/create-allow-and-params";

describe("createAllowAndParams", () => {
    test("should return the correct auth and params", () => {
        const auth: Auth = {
            type: "JWT",
            rules: [{ allow: { id: "sub" }, operations: ["create"] }],
        };

        // @ts-ignore
        const node: Node = {
            name: "Movie",
            enumFields: [],
            scalarFields: [],
            primitiveFields: [
                {
                    fieldName: "id",
                    typeMeta: {
                        name: "ID",
                        array: true,
                        required: false,
                        pretty: "ID!",
                    },
                    otherDirectives: [],
                    arguments: [],
                },
            ],
            relationFields: [],
            auth,
            dateTimeFields: [],
            interfaceFields: [],
            objectFields: [],
        };

        // @ts-ignore
        const neoSchema: NeoSchema = {
            nodes: [node],
        };

        // @ts-ignore
        const context = new Context({ neoSchema });

        context.jwt = { sub: "123" };

        const [str, params] = createAllowAndParams({
            context,
            node,
            varName: "this",
            operation: "create",
        });

        expect(str).toEqual(`CALL apoc.util.validate(NOT(this.id = $this_auth0_id), "Forbidden", [0])`);
        expect(params).toMatchObject({ this_auth0_id: "123" });
    });
});
