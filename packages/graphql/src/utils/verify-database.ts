import { Driver } from "neo4j-driver";
import { MIN_NEO4J_VERSION, MIN_APOC_VERSION, REQUIRED_APOC_FUNCTIONS, REQUIRED_APOC_PROCEDURES } from "../constants";
import { DriverConfig } from "../types";

interface DBInfo {
    version: string;
    apocVersion: string;
    functions: string[];
    procedures: string[];
}

async function verifyDatabase({ driver, driverConfig }: { driver: Driver; driverConfig?: DriverConfig }) {
    await driver.verifyConnectivity();

    const sessionParams: {
        bookmarks?: string | string[];
        database?: string;
    } = {};

    if (driverConfig) {
        if (driverConfig.database) {
            sessionParams.database = driverConfig.database;
        }

        if (driverConfig.bookmarks) {
            sessionParams.bookmarks = driverConfig.bookmarks;
        }
    }

    const session = driver.session(sessionParams);
    const cypher = `
        CALL dbms.components() yield versions
        WITH head(versions) AS version
        CALL dbms.functions() yield name AS functions
        WITH version, COLLECT(functions) AS functions
        CALL dbms.procedures() yield name AS procedures
        RETURN
            version,
            functions,
            COLLECT(procedures) AS procedures,
            CASE "apoc.version" IN functions
                WHEN true THEN apoc.version()
                ELSE false
            END AS apocVersion
    `;

    try {
        const result = await session.run(cypher);
        const info = result.records[0].toObject() as DBInfo;

        if (info.version < MIN_NEO4J_VERSION) {
            throw new Error(`Expected minimum Neo4j version: '${MIN_NEO4J_VERSION}' received: '${info.version}'`);
        }

        if (info.apocVersion < MIN_APOC_VERSION) {
            throw new Error(`Expected minimum APOC version: '${MIN_APOC_VERSION}' received: '${info.apocVersion}'`);
        }

        const missingFunctions = REQUIRED_APOC_FUNCTIONS.filter((f) => !info.functions.includes(f));
        if (missingFunctions.length) {
            throw new Error(`Missing APOC functions: [ ${missingFunctions.join(", ")} ]`);
        }

        const missingProcedures = REQUIRED_APOC_PROCEDURES.filter((p) => !info.procedures.includes(p));
        if (missingProcedures.length) {
            throw new Error(`Missing APOC procedures: [ ${missingProcedures.join(", ")} ]`);
        }
    } finally {
        await session.close();
    }
}

export default verifyDatabase;
