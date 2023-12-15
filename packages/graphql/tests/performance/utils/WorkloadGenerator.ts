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

import { Integer, Date, LocalTime, Duration, Time, DateTime } from "neo4j-driver";
import type { Neo4jGraphQL } from "../../../src";
import type * as Performance from "../types";
import * as fs from "fs/promises";
import * as path from "path";
import { translateQuery } from "../../tck/utils/tck-test-utils";
import gql from "graphql-tag";

// Initial configuration, add available configuration options here
type QueryConfig = {
    name: string;
    description: string;
    queryFile: string;
    parameters?: {
        file: string;
    };
};

type WorkloadConfig = {
    name: string;
    dataset: string;
    queries: QueryConfig[];
};

type DatasetConfig = {
    name: string;
    format: "aligned";
};

type WorkloadFile = {
    name: string;
    path: string;
    content: string;
};

export class WorkloadGenerator {
    private schema: Neo4jGraphQL;
    private name: string;

    constructor(schema: Neo4jGraphQL) {
        this.schema = schema;
        this.name = "graphql-workload";
    }
    public async generateWorkload(tests: Array<Performance.TestInfo>): Promise<void> {
        const directoryPath = `./${this.name}/`;
        const queryConfigs: QueryConfig[] = [];
        const queryFiles: WorkloadFile[] = [];
        const paramFiles: WorkloadFile[] = [];
        try {
            for (const test of tests) {
                const { cypher, params } = await this.getCypherAndParams(test);

                const queryFile = this.getQueryFile(test, cypher);
                queryFiles.push(queryFile);

                const paramFile = this.getParamFile(test, params);
                if (paramFile) {
                    paramFiles.push(paramFile);
                }

                const queryConfig = this.getQueryConfig(test.name, queryFile, paramFile);
                queryConfigs.push(queryConfig);
            }

            await fs.mkdir(directoryPath, { recursive: true });
            await fs.mkdir(path.join(directoryPath, "queries"), { recursive: true });
            await fs.mkdir(path.join(directoryPath, "params"), { recursive: true });

            const promises = [...queryFiles, ...paramFiles].map((file: WorkloadFile) => {
                return fs.writeFile(path.join(directoryPath, file.path), file.content);
            });
            await Promise.all(promises);
            const workflowConfig = this.getWorkflowConfig(queryConfigs);
            const datasetConfig = this.getDatasetConfig();
            await fs.writeFile(path.join(directoryPath, "config.json"), JSON.stringify(workflowConfig, null, 2));
            await fs.writeFile(path.join(directoryPath, "dataset.json"), JSON.stringify(datasetConfig, null, 2));
            await fs.writeFile(path.join(directoryPath, "schema.txt"), "");
        } catch (err) {
            console.error("Error generating workflow");
            console.warn(err);
        }
    }

    private getQueryFile(test: Performance.TestInfo, cypher: string): WorkloadFile {
        const name = test.name;
        const fileName = `${name}.cypher`;
        return {
            name,
            path: path.join("queries", fileName),
            content: cypher,
        };
    }

    private getParamFile(test: Performance.TestInfo, parameters: Record<string, any>): WorkloadFile | undefined {
        if (Object.keys(parameters).length === 0) {
            return;
        }
        const name = test.name;
        const fileName = `${name}.txt`;
        return {
            name,
            path: path.join("params", fileName),
            content: this.convertJSONtoCSV(parameters),
        };
    }

    private getQueryConfig(queryName: string, queryFile: WorkloadFile, paramFile?: WorkloadFile): QueryConfig {
        return {
            name: queryName,
            description: queryName,
            queryFile: queryFile.path,
            ...(paramFile
                ? {
                      parameters: {
                          file: paramFile.path,
                      },
                  }
                : {}),
        };
    }

    private getWorkflowConfig(queries: QueryConfig[]): WorkloadConfig {
        return {
            name: this.name,
            dataset: "dataset.json",
            queries,
        };
    }

    private getDatasetConfig(): DatasetConfig {
        return {
            name: "graphql-benchmark-dataset",
            format: "aligned",
        };
    }

    private async getCypherAndParams(
        test: Performance.TestInfo
    ): Promise<{ cypher: string; params: Record<string, any> }> {
        const cypherQuery = await translateQuery(this.schema, gql(test.query));
        return {
            cypher: cypherQuery.cypher,
            params: cypherQuery.params,
        };
    }
    /**
     * Convert our param format to the benchmarking tool's format
     **/
    private convertJSONtoCSV(input: Record<string, any>): string {
        let header = "";
        let row = "";
        const separator = "|";

        Object.entries(input).forEach(([key, value]) => {
            if (header.length) {
                header += separator;
            }
            if (row.length) {
                row += separator;
            }
            header += headerColumnRewriter(key, value);
            row += valueColumnRewriter(value);
        });
        return `${header}\n${row}`;
    }
}

/**
 * Add columnType to header colum, see https://github.com/neo-technology/neo4j/blob/dev/private/benchmarks/macro/macro-common/src/main/java/com/neo4j/bench/macro/workload/parameters/FileParametersReader.java
 **/
function headerColumnRewriter(key: string, value: any) {
    return `${key}:${getColumnType(value)}`;
}

function getColumnType(value: any) {
    if (value instanceof Integer) {
        return "Integer";
    }

    if (value instanceof Date) {
        return "Date";
    }

    if (value instanceof DateTime) {
        return "DateTime";
    }

    if (typeof value === "number") {
        return "Float";
    }
    if (typeof value === "string") {
        return "String";
    }

    if (value instanceof LocalTime || value instanceof Time || value instanceof Duration) {
        throw new Error("LocalTime, Time, Duration are not supported by the benchmarking tool");
    }

    if (typeof value === "boolean") {
        throw new Error("Boolean is not supported by the benchmarking tool");
    }

    if (Array.isArray(value)) {
        return `${getColumnType(value[0])}[]`;
    }

    if (typeof value === "object" && value !== null) {
        return "Map";
    }

    throw new Error(`Unknown type ${typeof value}`);
}

function valueColumnRewriter(value: any) {
    if (value instanceof Integer) {
        return value.toNumber();
    }

    if (value instanceof Date || value instanceof DateTime) {
        return value.toString();
    }

    if (typeof value === "number" || typeof value === "string") {
        return value;
    }

    if (value instanceof LocalTime || value instanceof Time || value instanceof Duration) {
        throw new Error("LocalTime, Time, Duration are not supported by the benchmarking tool");
    }

    if (typeof value === "boolean") {
        throw new Error("Boolean is not supported by the benchmarking tool");
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return "";
        }
        return `[${value.map((v) => valueColumnRewriter(v)).join(", ")}]`;
    }

    if (typeof value === "object" && value !== null) {
        const mapEntries = Object.entries(value).map(([key, value]) => {
            return `${key}:${valueColumnRewriter(value)}`;
        });
        if (mapEntries.length === 0) {
            return "";
        }
        return `{${mapEntries.join(", ")}}`;
    }

    throw new Error(`Unknown type ${typeof value}`);
}
