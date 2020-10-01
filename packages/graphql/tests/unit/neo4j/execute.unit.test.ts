import { Driver } from "neo4j-driver";
import execute from "../../../src/neo4j/execute";

describe("execute", () => {
    test("should execute READ return records returned toObject", async () => {
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

                // @ts-ignore
                const driver: Driver = {
                    // @ts-ignore
                    session: (options) => {
                        expect(options).toMatchObject({ defaultAccessMode });

                        return {
                            run: async (paramCypher, paramParams) => {
                                expect(paramCypher).toEqual(cypher);
                                expect(paramParams).toEqual(params);

                                return { records };
                            },
                            close: async () => true,
                        };
                    },
                };

                const result = await execute({ driver, cypher, params, defaultAccessMode });

                expect(result).toEqual([{ title }]);
            })
        );
    });
});
