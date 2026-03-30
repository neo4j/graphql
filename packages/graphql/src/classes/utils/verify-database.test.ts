/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Driver, Session } from "neo4j-driver";
import { MIN_NEO4J_VERSION, REQUIRED_APOC_FUNCTIONS } from "../../constants";
import type { Neo4jGraphQLSessionConfig } from "../Executor";
import { Neo4jDatabaseInfo } from "../Neo4jDatabaseInfo";
import checkNeo4jCompat from "./verify-database";

describe("checkNeo4jCompat", () => {
    test("should add driver config to session", async () => {
        const minVersion = MIN_NEO4J_VERSION;

        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                // @ts-ignore
                records: [
                    {
                        toObject: () => ({
                            version: minVersion,
                            functions: REQUIRED_APOC_FUNCTIONS,
                        }),
                    },
                ],
            }),
            // @ts-ignore
            close: () => undefined,
        };

        const sessionConfig: Neo4jGraphQLSessionConfig = {
            database: "darrellanddan",
        };

        // @ts-ignore
        const fakeDriver: Driver = {
            // @ts-ignore
            session: (config) => {
                expect(config).toEqual(sessionConfig);
                return fakeSession;
            },
            // @ts-ignore
            verifyConnectivity: () => undefined,
        };

        await expect(
            checkNeo4jCompat({
                driver: fakeDriver,
                sessionConfig,
                dbInfo: new Neo4jDatabaseInfo(minVersion),
            })
        ).resolves.not.toThrow();
    });

    test("should throw expected Neo4j version", async () => {
        const invalidVersion = "2.3.1";

        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                records: [
                    {
                        toObject: () => ({
                            version: invalidVersion,
                            functions: REQUIRED_APOC_FUNCTIONS,
                        }),
                    },
                ],
            }),
            // @ts-ignore
            close: () => undefined,
        };

        // @ts-ignore
        const fakeDriver: Driver = {
            // @ts-ignore
            session: () => fakeSession,
            // @ts-ignore
            verifyConnectivity: () => undefined,
        };

        await expect(
            checkNeo4jCompat({ driver: fakeDriver, dbInfo: new Neo4jDatabaseInfo(invalidVersion) })
        ).rejects.toThrow(
            `Encountered the following DBMS compatiblility issues:\nExpected minimum Neo4j version: '${MIN_NEO4J_VERSION}', received: '${invalidVersion}'`
        );
    });

    test("should throw expected Neo4j version for 4.3", async () => {
        const invalidVersion = "4.3.2";

        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                records: [
                    {
                        toObject: () => ({
                            version: invalidVersion,
                            functions: REQUIRED_APOC_FUNCTIONS,
                        }),
                    },
                ],
            }),
            // @ts-ignore
            close: () => undefined,
        };

        // @ts-ignore
        const fakeDriver: Driver = {
            // @ts-ignore
            session: () => fakeSession,
            // @ts-ignore
            verifyConnectivity: () => undefined,
        };

        await expect(
            checkNeo4jCompat({ driver: fakeDriver, dbInfo: new Neo4jDatabaseInfo(invalidVersion) })
        ).rejects.toThrow(
            `Encountered the following DBMS compatiblility issues:\nExpected minimum Neo4j version: '${MIN_NEO4J_VERSION}', received: '${invalidVersion}'`
        );
    });

    test("should not throw Error for Aura version numbers", async () => {
        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                records: [
                    {
                        toObject: () => ({
                            version: "4.0-aura",
                            functions: REQUIRED_APOC_FUNCTIONS,
                        }),
                    },
                ],
            }),
            // @ts-ignore
            close: () => undefined,
        };

        // @ts-ignore
        const fakeDriver: Driver = {
            // @ts-ignore
            session: () => fakeSession,
            // @ts-ignore
            verifyConnectivity: () => undefined,
        };

        await expect(
            checkNeo4jCompat({ driver: fakeDriver, dbInfo: new Neo4jDatabaseInfo("4.0-aura") })
        ).resolves.not.toThrow();
    });

    test("should throw missing APOC functions", async () => {
        const minVersion = MIN_NEO4J_VERSION;
        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                records: [
                    {
                        toObject: () => ({
                            version: minVersion,
                            functions: [],
                        }),
                    },
                ],
            }),
            // @ts-ignore
            close: () => undefined,
        };

        // @ts-ignore
        const fakeDriver: Driver = {
            // @ts-ignore
            session: () => fakeSession,
            // @ts-ignore
            verifyConnectivity: () => undefined,
        };

        await expect(
            checkNeo4jCompat({ driver: fakeDriver, dbInfo: new Neo4jDatabaseInfo(minVersion) })
        ).rejects.toThrow(
            `Encountered the following DBMS compatiblility issues:\nMissing APOC functions: [ ${REQUIRED_APOC_FUNCTIONS.join(
                ", "
            )} ]`
        );
    });

    test("should throw no errors with valid DB", async () => {
        const minVersion = MIN_NEO4J_VERSION;

        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                records: [
                    {
                        toObject: () => ({
                            version: minVersion,
                            functions: REQUIRED_APOC_FUNCTIONS,
                        }),
                    },
                ],
            }),
            // @ts-ignore
            close: () => undefined,
        };

        // @ts-ignore
        const fakeDriver: Driver = {
            // @ts-ignore
            session: () => fakeSession,
            // @ts-ignore
            verifyConnectivity: () => undefined,
        };

        await expect(
            checkNeo4jCompat({ driver: fakeDriver, dbInfo: new Neo4jDatabaseInfo(minVersion) })
        ).resolves.not.toThrow();
    });

    test("should throw no errors with valid DB (greater versions)", async () => {
        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                records: [
                    {
                        toObject: () => ({
                            version: "20.1.1",
                            functions: REQUIRED_APOC_FUNCTIONS,
                        }),
                    },
                ],
            }),
            // @ts-ignore
            close: () => undefined,
        };

        // @ts-ignore
        const fakeDriver: Driver = {
            // @ts-ignore
            session: () => fakeSession,
            // @ts-ignore
            verifyConnectivity: () => undefined,
        };

        await expect(
            checkNeo4jCompat({ driver: fakeDriver, dbInfo: new Neo4jDatabaseInfo("20.1.1") })
        ).resolves.not.toThrow();
    });

    test("should throw Error for Neo4j 4.4", async () => {
        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                records: [
                    {
                        toObject: () => ({
                            version: "4.4.37",
                            functions: REQUIRED_APOC_FUNCTIONS,
                        }),
                    },
                ],
            }),
            // @ts-ignore
            close: () => undefined,
        };

        // @ts-ignore
        const fakeDriver: Driver = {
            // @ts-ignore
            session: () => fakeSession,
            // @ts-ignore
            verifyConnectivity: () => undefined,
        };

        await expect(checkNeo4jCompat({ driver: fakeDriver, dbInfo: new Neo4jDatabaseInfo("4.4.37") })).rejects.toThrow(
            `Encountered the following DBMS compatiblility issues:\nExpected minimum Neo4j version: '${MIN_NEO4J_VERSION}', received: '4.4.37'`
        );
    });
});
