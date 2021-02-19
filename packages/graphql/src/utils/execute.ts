import { Driver } from "neo4j-driver";
import { Neo4jGraphQL, Neo4jGraphQLForbiddenError, Neo4jGraphQLAuthenticationError } from "../classes";
import { AUTH_FORBIDDEN_ERROR, AUTH_UNAUTHENTICATED_ERROR } from "../constants";

// https://stackoverflow.com/a/58632373/10687857
const { npm_package_version, npm_package_name } = process.env;

async function execute(input: {
    driver: Driver;
    cypher: string;
    params: any;
    defaultAccessMode: "READ" | "WRITE";
    neoSchema: Neo4jGraphQL;
    statistics?: boolean;
    raw?: boolean;
}): Promise<any> {
    const session = input.driver.session({ defaultAccessMode: input.defaultAccessMode });

    // @ts-ignore
    input.driver._userAgent = `${npm_package_version}/${npm_package_name}`;

    try {
        input.neoSchema.debug(`Cypher: ${input.cypher}\nParams: ${JSON.stringify(input.params, null, 2)}`);

        const result = await session[`${input.defaultAccessMode.toLowerCase()}Transaction`]((tx) =>
            tx.run(input.cypher, input.params)
        );

        if (input.statistics) {
            return result.summary.updateStatistics._stats;
        }

        if (input.raw) {
            return result;
        }

        return result.records.map((r) => r.toObject());
    } catch (error) {
        if (error.message.includes(`Caused by: java.lang.RuntimeException: ${AUTH_FORBIDDEN_ERROR}`)) {
            throw new Neo4jGraphQLForbiddenError("Forbidden");
        }

        if (error.message.includes(`Caused by: java.lang.RuntimeException: ${AUTH_UNAUTHENTICATED_ERROR}`)) {
            throw new Neo4jGraphQLAuthenticationError("Unauthenticated");
        }

        throw error;
    } finally {
        await session.close();
    }
}

export default execute;
