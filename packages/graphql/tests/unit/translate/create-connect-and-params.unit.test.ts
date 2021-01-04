import { describe, test, expect } from "@jest/globals";
import createConnectAndParams from "../../../src/translate/create-connect-and-params";
import { NeoSchema, Node, Context } from "../../../src/classes";
import { trimmer } from "../../../src/utils";

describe("createConnectAndParams", () => {
    test("should return the correct connection", () => {
        // @ts-ignore
        const node: Node = {
            name: "Movie",
            enumFields: [],
            scalarFields: [],
            primitiveFields: [
                {
                    fieldName: "title",
                    // @ts-ignore
                    typeMeta: { name: "Sting" },
                },
            ],
            relationFields: [
                {
                    direction: "OUT",
                    type: "SIMILAR",
                    fieldName: "similarMovies",
                    // @ts-ignore
                    typeMeta: {
                        name: "Movie",
                        array: true,
                        required: false,
                        pretty: "[Movies]",
                    },
                    otherDirectives: [],
                    arguments: [],
                },
            ],
            cypherFields: [],
        };

        // @ts-ignore
        const neoSchema: NeoSchema = {
            nodes: [node],
        };

        // @ts-ignore
        const context = new Context({ neoSchema });

        const result = createConnectAndParams({
            withVars: ["this"],
            value: [{ where: { title: "abc" }, connect: { similarMovies: [{ where: { title: "cba" } }] } }],
            varName: "this",
            relationField: node.relationFields[0],
            parentVar: "this",
            context,
            refNode: node,
        });

        expect(trimmer(result[0])).toEqual(
            trimmer(`
                WITH this
                OPTIONAL MATCH (this0:Movie)
                WHERE this0.title = $this0_title 
                FOREACH(_ IN CASE this0 WHEN NULL THEN [] ELSE [1] END | MERGE (this)-[:SIMILAR]->(this0) )

                WITH this, this0 
                OPTIONAL MATCH (this0_similarMovies0:Movie) 
                WHERE this0_similarMovies0.title = $this0_similarMovies0_title 
                FOREACH(_ IN CASE this0_similarMovies0 WHEN NULL THEN [] ELSE [1] END | MERGE (this0)-[:SIMILAR]->(this0_similarMovies0) )
            `)
        );

        expect(result[1]).toMatchObject({
            this0_title: "abc",
            this0_similarMovies0_title: "cba",
        });
    });
});
