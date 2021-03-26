import { Driver, SessionMode } from "neo4j-driver";
import { Neo4jGraphQL, Neo4jGraphQLForbiddenError, Neo4jGraphQLAuthenticationError } from "../classes";
import { AUTH_FORBIDDEN_ERROR, AUTH_UNAUTHENTICATED_ERROR } from "../constants";
import { DriverConfig } from "../types";

// https://stackoverflow.com/a/58632373/10687857
const { npm_package_version: npmPackageVersion, npm_package_name: npmPackageName } = process.env;

async function execute(input: {
    driver: Driver;
    cypher: string;
    params: any;
    defaultAccessMode: SessionMode;
    neoSchema: Neo4jGraphQL;
    statistics?: boolean;
    raw?: boolean;
    graphQLContext: any;
}): Promise<any> {
    const sessionParams: {
        defaultAccessMode?: SessionMode;
        bookmarks?: string | string[];
        database?: string;
    } = { defaultAccessMode: input.defaultAccessMode };

    const driverConfig = input.graphQLContext.driverConfig as DriverConfig;
    if (driverConfig) {
        if (driverConfig.database) {
            sessionParams.database = driverConfig.database;
        }

        if (driverConfig.bookmarks) {
            sessionParams.bookmarks = driverConfig.bookmarks;
        }
    }

    const session = input.driver.session(sessionParams);

    // @ts-ignore: Required to set connection user agent
    input.driver._userAgent = `${npmPackageVersion}/${npmPackageName}`; // eslint-disable-line no-underscore-dangle

    try {
        input.neoSchema.debug(`Cypher: ${input.cypher}\nParams: ${JSON.stringify(input.params, null, 2)}`);

        const result = await session[`${input.defaultAccessMode.toLowerCase()}Transaction`]((tx) =>
            tx.run(input.cypher, input.params)
        );

        if (input.statistics) {
            return result.summary.updateStatistics._stats; // eslint-disable-line no-underscore-dangle
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
