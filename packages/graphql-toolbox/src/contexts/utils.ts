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

import { request } from "graphql-request";
import * as neo4j from "neo4j-driver";
import { LoginPayload, Neo4jDatabase } from "../types";

const GET_DATABASES_QUERY = `
    query {
        workspace {
            projects {
            name
                graphs {
                    name
                    status
                    connection {
                        info {
                            version
                            edition
                        }
                        principals {
                            protocols {
                                bolt {
                                    tlsLevel
                                    url
                                    username
                                    password
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`;

export const resolveNeo4jDesktopLoginPayload = async (): Promise<LoginPayload | null> => {
    const url = new URL(window.location.href);
    const apiEndpoint = url.searchParams.get("neo4jDesktopApiUrl");
    const clientId = url.searchParams.get("neo4jDesktopGraphAppClientId");

    if (!apiEndpoint && !clientId) {
        return null;
    }
    try {
        const data = await request({
            url: apiEndpoint || "",
            document: GET_DATABASES_QUERY,
            requestHeaders: {
                clientId: clientId || "",
            },
        });
        if (!data) {
            return null;
        }

        const graphsData = data?.workspace?.projects
            .map((project) => ({
                graphs: project.graphs.filter((graph) => graph.status === "ACTIVE"),
            }))
            .reduce((acc, { graphs }) => acc.concat(graphs), []);

        if (!graphsData.length) {
            return null;
        }

        const { url: boltUrl, username, password } = graphsData[0].connection.principals.protocols.bolt;

        // INFO: to get the current database name and all available databases use cypher "SHOW databases"

        return {
            url: boltUrl,
            username,
            password,
        };
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log("Error while fetching and processing Neo4jDesktop GraphQL API, e: ", error);
        return null;
    }
};

export const getDatabases = async (driver: neo4j.Driver): Promise<Neo4jDatabase[] | undefined> => {
    const session = driver.session();
    let cleanedDatabases: Neo4jDatabase[] = [];
    try {
        const result = await session.run("SHOW DATABASES");
        if (!result || !result.records) return undefined;
        cleanedDatabases = result.records
            .map((rec) => rec.toObject())
            .filter((rec) => rec.access === "read-write" && rec.currentStatus === "online") as Neo4jDatabase[];
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error while fetching databases information, e: ", error);
        await session.close();
        return undefined;
    }

    await session.close();
    return cleanedDatabases;
};

export const getConnectUrlSearchParam = (): string | null => {
    const queryString = window.location.search;
    if (!queryString) return null;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get("connectURL");
};
