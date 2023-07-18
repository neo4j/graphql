/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Driver, Session, SessionConfig } from "neo4j-driver";
import checkNeo4jCompat from "./verify-database";
import { REQUIRED_APOC_FUNCTIONS, REQUIRED_APOC_PROCEDURES, MIN_VERSIONS } from "../../constants";
import { Neo4jDatabaseInfo } from "../Neo4jDatabaseInfo";

describe("checkNeo4jCompat", () => {
    test("should add driver config to session", async () => {
        const minVersion = MIN_VERSIONS[0];

        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                // @ts-ignore
                records: [
                    {
                        toObject: () => ({
                            version: minVersion.neo4j,
                            functions: REQUIRED_APOC_FUNCTIONS,
                            procedures: REQUIRED_APOC_PROCEDURES,
                        }),
                    },
                ],
            }),
            // @ts-ignore
            close: () => undefined,
        };

        const sessionConfig: SessionConfig = {
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
                dbInfo: new Neo4jDatabaseInfo(minVersion.neo4j),
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
                            procedures: REQUIRED_APOC_PROCEDURES,
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
            `Encountered the following DBMS compatiblility issues:\nExpected Neo4j version '${MIN_VERSIONS[0].majorMinor}' or greater, received: '${invalidVersion}'`
        );
    });

    test("should not throw Error that 4.3.10 is less than 4.3.5", async () => {
        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                records: [
                    {
                        toObject: () => ({
                            version: "4.3.10",
                            functions: REQUIRED_APOC_FUNCTIONS,
                            procedures: REQUIRED_APOC_PROCEDURES,
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
            checkNeo4jCompat({ driver: fakeDriver, dbInfo: new Neo4jDatabaseInfo("4.3.10") })
        ).resolves.not.toThrow();
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
                            procedures: REQUIRED_APOC_PROCEDURES,
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
        const minVersion = MIN_VERSIONS[0];

        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                records: [
                    {
                        toObject: () => ({
                            version: minVersion.neo4j,
                            functions: [],
                            procedures: REQUIRED_APOC_PROCEDURES,
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
            checkNeo4jCompat({ driver: fakeDriver, dbInfo: new Neo4jDatabaseInfo(minVersion.neo4j) })
        ).rejects.toThrow(
            `Encountered the following DBMS compatiblility issues:\nMissing APOC functions: [ ${REQUIRED_APOC_FUNCTIONS.join(
                ", "
            )} ]`
        );
    });

    test("should throw missing APOC procedures", async () => {
        const minVersion = MIN_VERSIONS[0];

        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                records: [
                    {
                        toObject: () => ({
                            version: minVersion.neo4j,
                            functions: REQUIRED_APOC_FUNCTIONS,
                            procedures: [],
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
            checkNeo4jCompat({ driver: fakeDriver, dbInfo: new Neo4jDatabaseInfo(minVersion.neo4j) })
        ).rejects.toThrow(
            `Encountered the following DBMS compatiblility issues:\nMissing APOC procedures: [ ${REQUIRED_APOC_PROCEDURES.join(
                ", "
            )} ]`
        );
    });

    test("should throw no errors with valid DB", async () => {
        const minVersion = MIN_VERSIONS[0];

        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                records: [
                    {
                        toObject: () => ({
                            version: minVersion.neo4j,
                            functions: REQUIRED_APOC_FUNCTIONS,
                            procedures: REQUIRED_APOC_PROCEDURES,
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
            checkNeo4jCompat({ driver: fakeDriver, dbInfo: new Neo4jDatabaseInfo(minVersion.neo4j) })
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
                            procedures: REQUIRED_APOC_PROCEDURES,
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

    test("should not throw Error that 4.2 is minimum", async () => {
        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                records: [
                    {
                        toObject: () => ({
                            version: "4.1.10",
                            functions: REQUIRED_APOC_FUNCTIONS,
                            procedures: REQUIRED_APOC_PROCEDURES,
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

        await expect(checkNeo4jCompat({ driver: fakeDriver, dbInfo: new Neo4jDatabaseInfo("4.1.10") })).rejects.toThrow(
            `Encountered the following DBMS compatiblility issues:\nExpected Neo4j version '${MIN_VERSIONS[0].majorMinor}' or greater, received: '4.1.10'`
        );
    });
});
