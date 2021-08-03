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

import { Driver, Session } from "neo4j-driver";
import checkNeo4jCompat from "./verify-database";
import { MIN_NEO4J_VERSION, MIN_APOC_VERSION, REQUIRED_APOC_FUNCTIONS, REQUIRED_APOC_PROCEDURES } from "../constants";
import { DriverConfig } from "../types";

describe("checkNeo4jCompat", () => {
    test("should add driver config to session", async () => {
        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                // @ts-ignore
                records: [
                    {
                        toObject: () => ({
                            version: MIN_NEO4J_VERSION,
                            apocVersion: MIN_APOC_VERSION,
                            functions: REQUIRED_APOC_FUNCTIONS,
                            procedures: REQUIRED_APOC_PROCEDURES,
                        }),
                    },
                ],
            }),
            // @ts-ignore
            close: () => undefined,
        };

        const driverConfig: DriverConfig = {
            database: "darrellanddan",
            bookmarks: ["darrell", "dan"],
        };

        // @ts-ignore
        const fakeDriver: Driver = {
            // @ts-ignore
            session: (config) => {
                expect(config).toEqual(driverConfig);
                return fakeSession;
            },
            // @ts-ignore
            verifyConnectivity: () => undefined,
        };

        await expect(checkNeo4jCompat({ driver: fakeDriver, driverConfig })).resolves.not.toThrow();
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
                            apocVersion: MIN_APOC_VERSION,
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

        await expect(checkNeo4jCompat({ driver: fakeDriver })).rejects.toThrow(
            `Encountered the following DBMS compatiblility issues:\nExpected minimum Neo4j version: '${MIN_NEO4J_VERSION}' received: '${invalidVersion}'`
        );
    });

    test("should not throw Error that 4.1.10 is less than 4.1.5", async () => {
        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                records: [
                    {
                        toObject: () => ({
                            version: "4.1.10",
                            apocVersion: MIN_APOC_VERSION,
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

        await expect(checkNeo4jCompat({ driver: fakeDriver })).resolves.not.toThrow();
    });

    test("should not throw Error for Aura version numbers", async () => {
        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                records: [
                    {
                        toObject: () => ({
                            version: "4.2-aura",
                            apocVersion: MIN_APOC_VERSION,
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

        await expect(checkNeo4jCompat({ driver: fakeDriver })).resolves.not.toThrow();
    });

    test("should throw expected APOC version", async () => {
        const invalidApocVersion = "2.3.1";

        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                records: [
                    {
                        toObject: () => ({
                            version: MIN_NEO4J_VERSION,
                            apocVersion: invalidApocVersion,
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

        await expect(checkNeo4jCompat({ driver: fakeDriver })).rejects.toThrow(
            `Encountered the following DBMS compatiblility issues:\nExpected minimum APOC version: '${MIN_APOC_VERSION}' received: '${invalidApocVersion}'`
        );
    });

    test("should throw missing APOC functions", async () => {
        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                records: [
                    {
                        toObject: () => ({
                            version: MIN_NEO4J_VERSION,
                            apocVersion: MIN_APOC_VERSION,
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

        await expect(checkNeo4jCompat({ driver: fakeDriver })).rejects.toThrow(
            `Encountered the following DBMS compatiblility issues:\nMissing APOC functions: [ ${REQUIRED_APOC_FUNCTIONS.join(
                ", "
            )} ]`
        );
    });

    test("should throw missing APOC procedures", async () => {
        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                records: [
                    {
                        toObject: () => ({
                            version: MIN_NEO4J_VERSION,
                            apocVersion: MIN_APOC_VERSION,
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

        await expect(checkNeo4jCompat({ driver: fakeDriver })).rejects.toThrow(
            `Encountered the following DBMS compatiblility issues:\nMissing APOC procedures: [ ${REQUIRED_APOC_PROCEDURES.join(
                ", "
            )} ]`
        );
    });

    test("should throw no errors with valid DB", async () => {
        // @ts-ignore
        const fakeSession: Session = {
            // @ts-ignore
            run: () => ({
                records: [
                    {
                        toObject: () => ({
                            version: MIN_NEO4J_VERSION,
                            apocVersion: MIN_APOC_VERSION,
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

        await expect(checkNeo4jCompat({ driver: fakeDriver })).resolves.not.toThrow();
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
                            apocVersion: "20.1.0.0",
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

        await expect(checkNeo4jCompat({ driver: fakeDriver })).resolves.not.toThrow();
    });
});
