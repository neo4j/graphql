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

import type * as neo4j from "neo4j-driver";
import type { LoginPayload, Neo4jDatabase } from "../types";
import { CONNECT_URL_PARAM_NAME, DATABASE_PARAM_NAME, DEFAULT_DATABASE_NAME } from "../constants";
import { useStore } from "../store";

const isMultiDbUnsupportedError = (e: Error) => {
    if (
        e.message.includes("This is an administration command and it should be executed against the system database") ||
        e.message.includes("Neo4jError: Unsupported administration command") ||
        e.message.includes("Neo4jError: Unable to route write operation to leader for database 'system'") ||
        e.message.includes("Invalid input 'H': expected 't/T' or 'e/E'") // Neo4j 3.5 or older
    ) {
        return true;
    }
    return false;
};

export const resolveNeo4jDesktopLoginPayload = async (): Promise<LoginPayload | null> => {
    if (!window?.neo4jDesktopApi?.getContext) {
        return null;
    }

    try {
        const context = (await window.neo4jDesktopApi.getContext()) as Record<string, any>;
        if (!context) {
            return null;
        }

        const graphsData = context.projects
            .map((project) => ({
                graphs: project.graphs.filter((graph) => graph.status === "ACTIVE"),
            }))
            .reduce((acc, { graphs }) => acc.concat(graphs), []);
        if (!graphsData.length) {
            return null;
        }

        const boltProtocolData = graphsData[0].connection.configuration.protocols.bolt;
        if (!boltProtocolData) {
            return null;
        }

        const { url, username, password } = boltProtocolData;

        // INFO: to get the current database name and all available databases use cypher "SHOW databases"

        return {
            url,
            username,
            password,
        };
    } catch (error) {
        console.log("Error while fetching and processing window Neo4jDesktopAPI, error: ", error);
        return null;
    }
};

export const getDatabases = async (driver: neo4j.Driver): Promise<Neo4jDatabase[] | undefined> => {
    const session = driver.session();

    try {
        const result = await session.run("SHOW DATABASES");
        if (!result || !result.records) return undefined;

        const cleanedDatabases: Neo4jDatabase[] = result.records
            .map((rec) => rec.toObject())
            .filter(
                (rec) =>
                    rec.access === "read-write" &&
                    rec.currentStatus === "online" &&
                    (rec.name || "").toLowerCase() !== "system"
            ) as Neo4jDatabase[];

        await session.close();
        return cleanedDatabases;
    } catch (error) {
        await session.close();
        if (error instanceof Error && !isMultiDbUnsupportedError(error)) {
            // Only log error if it's not a multi-db unsupported error.

            console.error("Error while fetching databases information, e: ", error);
        }
        return undefined;
    }
};

export const checkDatabaseHasData = async (driver: neo4j.Driver, selectedDatabaseName: string): Promise<boolean> => {
    const session = driver.session({ database: selectedDatabaseName });

    try {
        const result = await session.run("MATCH (n) RETURN n LIMIT 5");
        if (!result || !result.records) return false;

        const resultLength = result.records.map((rec) => rec.toObject()).length;

        await session.close();
        return resultLength > 0;
    } catch (error) {
        await session.close();

        console.error("Error while checking if database contains data, e: ", error);
        return false;
    }
};

export const getUrlSearchParam = (paramName: string): string | null => {
    const queryString = window.location.search;
    if (!queryString) return null;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(paramName);
};

export const getConnectUrlSearchParamValue = (): {
    url: string;
    username: string | null;
    protocol: string;
} | null => {
    const dbmsParam = getUrlSearchParam(CONNECT_URL_PARAM_NAME as string);
    if (!dbmsParam) return null;

    const [protocol, host] = dbmsParam.split(/:\/\//);
    if (!protocol || !host) return null;

    const [username, href] = host.split(/@/);
    if (!username || !href) {
        return { protocol, username: null, url: `${protocol}://${host}` };
    }
    return { protocol, username, url: `${protocol}://${href}` };
};

export const resolveSelectedDatabaseName = (databases: Neo4jDatabase[]): string => {
    let usedDatabaseName: string | null = null;

    const searchParam = getUrlSearchParam(DATABASE_PARAM_NAME as string);
    if (searchParam) {
        useStore.getState().setSelectedDatabaseName(searchParam);
        usedDatabaseName = searchParam;
    } else {
        usedDatabaseName = useStore.getState().selectedDatabaseName;
    }

    const isSelectedDatabaseAvailable = databases?.find((database) => database.name === usedDatabaseName);
    if (isSelectedDatabaseAvailable && usedDatabaseName) {
        return usedDatabaseName;
    }

    const defaultOrHomeDatabase = databases?.find((database) => database.default || database.home);
    if (defaultOrHomeDatabase) {
        return defaultOrHomeDatabase.name;
    }

    if (databases?.length === 1) {
        return databases[0].name;
    }

    return DEFAULT_DATABASE_NAME;
};
