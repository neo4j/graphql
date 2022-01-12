import { Driver, Session } from "neo4j-driver";
import gql from "graphql-tag";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { OGM } from "../../src";
import { generateUniqueType } from "../utils";

describe("pluralize with underscore", () => {
    const taskType = generateUniqueType("super_task");

    const typeDefs = gql`
        type ${taskType.name} {
            string: String
        }
    `;

    let driver: Driver;
    let session: Session;

    beforeAll(async () => {
        driver = await neo4j();
    });

    beforeEach(() => {
        session = driver.session();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create super_task", async () => {
        const ogm = new OGM({ typeDefs, driver });
        const Task = ogm.model(taskType.name);

        const testString = generate({
            charset: "alphabetic",
        });

        const result = await Task?.create({ input: [{ string: testString }] });
        expect(result[taskType.plural]).toEqual([{ string: testString }]);

        const reFind = await session.run(
            `
                MATCH (m:${taskType.name} {string: $str})
                RETURN m
            `,
            { str: testString }
        );

        expect((reFind.records[0].toObject() as any).m.properties).toMatchObject({ string: testString });
    });

    test("should find super_task", async () => {
        const ogm = new OGM({ typeDefs, driver });
        const Task = ogm.model(taskType.name);

        const testString = generate({
            charset: "alphabetic",
        });

        await session.run(`
                    CREATE (:${taskType.name} {string: "${testString}"})
                `);

        const result = await Task.find({ where: { string: testString } });
        expect(result).toEqual([{ string: testString }]);
    });

    test("counts super_task", async () => {
        const ogm = new OGM({ typeDefs, driver });
        const Task = ogm.model(taskType.name);

        const testString = generate({
            charset: "alphabetic",
        });

        await session.run(`
                    CREATE (:${taskType.name} {string: "${testString}"})
                `);

        const result = await Task.count({ where: { string: testString } });
        expect(result).toBe(1);
    });
});
