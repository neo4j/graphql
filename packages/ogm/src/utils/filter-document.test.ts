import { parse, print } from "graphql";
import filterDocument from "./filter-document";

describe("filterDocument", () => {
    test("should remove all directives", () => {
        const initial = `
            type User @auth @exclude {
                id: ID @auth @private @readonly @writeonly
                name: String @auth @private @readonly @writeonly
                email: String @auth @private @readonly @writeonly
                password: String @auth @private @readonly @writeonly
            }


        `;

        const filtered = filterDocument(initial);

        expect(print(filtered)).toEqual(
            print(
                parse(`
                    type User {
                        id: ID
                        name: String
                        email: String
                        password: String
                    }
                `)
            )
        );
    });
});
