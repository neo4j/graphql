import { expect, describe, test } from "@jest/globals";
import { Driver } from "neo4j-driver";
import { Context, Neo4jGraphQL } from "../../../src/classes";
import execute from "../../../src/utils/execute";

describe("execute", () => {
    test("should execute return records.toObject", async () => {
        await Promise.all(
            ["READ", "WRITE"].map(async (access) => {
                const defaultAccessMode = access as "READ" | "WRITE";

                const cypher = `
                    CREATE (u:User {title: $title})
                    RETURN u { .title } as u
                `;

                const title = "some title";
                const params = { title };
                const records = [{ toObject: () => ({ title }) }];
                const database = "neo4j";
                const bookmarks = ["test"];

                // @ts-ignore
                const driver: Driver = {
                    // @ts-ignore
                    session: (options) => {
                        expect(options).toMatchObject({ defaultAccessMode, database, bookmarks });

                        const tx = {
                            run: async (paramCypher, paramParams) => {
                                expect(paramCypher).toEqual(cypher);
                                expect(paramParams).toEqual(params);

                                return { records };
                            },
                        };

                        return {
                            readTransaction: (fn) => {
                                // @ts-ignore
                                return fn(tx);
                            },
                            writeTransaction: (fn) => {
                                // @ts-ignore
                                return fn(tx);
                            },
                            close: async () => true,
                        };
                    },
                };

                // @ts-ignore
                const neoSchema: Neo4jGraphQL = {
                    // @ts-ignore
                    options: {},
                    debug: (message) => {
                        expect(message).toEqual(`Cypher: ${cypher}\nParams: ${JSON.stringify(params, null, 2)}`);
                    },
                };

                const result = await execute({
                    driver,
                    cypher,
                    params,
                    defaultAccessMode,
                    neoSchema,
                    graphQLContext: { driverConfig: { database, bookmarks } },
                });

                expect(result).toEqual([{ title }]);
            })
        );
    });
});
