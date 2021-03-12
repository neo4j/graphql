import createDisconnectAndParams from "../../../src/translate/create-disconnect-and-params";
import { Neo4jGraphQL, Node, Context } from "../../../src/classes";
import { trimmer } from "../../../src/utils";

describe("createDisconnectAndParams", () => {
    test("should return the correct disconnect", () => {
        // @ts-ignore
        const node: Node = {
            name: "Movie",
            relationFields: [
                {
                    direction: "OUT",
                    type: "SIMILAR",
                    fieldName: "similarMovies",
                    typeMeta: {
                        name: "Movie",
                        array: true,
                        required: false,
                        pretty: "[Movies]",
                        input: {
                            where: {
                                type: "Movie",
                                pretty: "[Movie]",
                            },
                            create: {
                                type: "Movie",
                                pretty: "[Movie]",
                            },
                            update: {
                                type: "Movie",
                                pretty: "[Movie]",
                            },
                        },
                    },
                    otherDirectives: [],
                    arguments: [],
                },
            ],
            cypherFields: [],
            enumFields: [],
            scalarFields: [],
            primitiveFields: [],
            dateTimeFields: [],
            interfaceFields: [],
            unionFields: [],
            objectFields: [],
            pointFields: [],
            otherDirectives: [],
            interfaces: [],
        };

        // @ts-ignore
        const neoSchema: Neo4jGraphQL = {
            nodes: [node],
        };

        // @ts-ignore
        const context = new Context({ neoSchema });

        const result = createDisconnectAndParams({
            withVars: ["this"],
            value: [{ where: { title: "abc" }, disconnect: { similarMovies: [{ where: { title: "cba" } }] } }],
            varName: "this",
            relationField: node.relationFields[0],
            parentVar: "this",
            context,
            refNode: node,
            parentNode: node,
        });

        expect(trimmer(result[0])).toEqual(
            trimmer(`
            WITH this
            OPTIONAL MATCH (this)-[this0_rel:SIMILAR]->(this0:Movie)
            WHERE this0.title = $this0_title
            FOREACH(_ IN CASE this0 WHEN NULL THEN [] ELSE [1] END |
                DELETE this0_rel
            )
            WITH this, this0
            OPTIONAL MATCH (this0)-[this0_similarMovies0_rel:SIMILAR]->(this0_similarMovies0:Movie)
            WHERE this0_similarMovies0.title = $this0_similarMovies0_title
            FOREACH(_ IN CASE this0_similarMovies0 WHEN NULL THEN [] ELSE [1] END |
                DELETE this0_similarMovies0_rel
            )
            `)
        );

        expect(result[1]).toMatchObject({
            this0_title: "abc",
            this0_similarMovies0_title: "cba",
        });
    });
});
