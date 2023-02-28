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

import * as fs from "fs/promises";
import * as path from "path";
import type * as Performance from "../types";

export async function collectTests(rootPath: string): Promise<Array<Performance.TestInfo>> {
    const files = await filesFromDir(rootPath, ".graphql");
    let onlyFilter = false;
    const onlyRegex = /_only$/i;
    const skipRegex = /_skip$/i;
    const testFilesData = await Promise.all(
        files.map(async (filePath) => {
            const fileData = await fs.readFile(filePath, "utf-8");
            const rawQueries = fileData.split(/^query\s/gm);
            const rawMutations = fileData.split(/^mutation\s/gm);
            rawQueries.shift();
            rawMutations.shift();
            // TODO: remove duplicate
            const queries = rawQueries.map((query: string): Performance.TestInfo => {
                const name = query.split(" {")[0].trim();
                if (name.match(onlyRegex)) onlyFilter = true;
                return {
                    query: `query ${query}`,
                    name,
                    filename: path.basename(filePath).split(path.extname(filePath))[0],
                    type: "query",
                };
            });
            const mutations = rawMutations.map((query: string): Performance.TestInfo => {
                const name = query.split(" {")[0].trim();
                if (name.match(onlyRegex)) onlyFilter = true;
                return {
                    query: `mutation ${query}`,
                    name,
                    filename: path.basename(filePath).split(path.extname(filePath))[0],
                    type: "mutation",
                };
            });
            return [...queries, ...mutations];
        }),
    );

    const tests = testFilesData.flat().filter((t) => !t.name.match(skipRegex));

    if (onlyFilter) {
        return tests.filter((t) => t.name.match(onlyRegex));
    }
    return tests;
}

export async function collectCypherTests(rootPath: string): Promise<Array<Performance.TestInfo>> {
    const files = await filesFromDir(rootPath, ".cypher");

    let onlyFilter = false;
    const onlyRegex = /_only$/i;
    const skipRegex = /_skip$/i;
    const testFilesData = await Promise.all(
        files.map(async (filePath) => {
            const fileData = await fs.readFile(filePath, "utf-8");
            const rawQueries = fileData.split(/^#\s?Test:\s/gim);
            rawQueries.shift();
            return rawQueries.map((query: string): Performance.TestInfo => {
                const tokens = query.trim().split("\n");
                const name = tokens.shift()?.trim() as string;
                if (name.match(onlyRegex)) onlyFilter = true;
                const cypher = tokens.join("\n");
                return {
                    query: cypher,
                    name,
                    filename: path.basename(filePath).split(path.extname(filePath))[0],
                    type: "cypher",
                };
            });
        }),
    );

    const tests = testFilesData.flat().filter((t) => !t.name.match(skipRegex));

    if (onlyFilter) {
        return tests.filter((t) => t.name.match(onlyRegex));
    }
    return tests;
}

async function filesFromDir(startPath: string, filter: string): Promise<string[]> {
    const files = await fs.readdir(startPath);
    const filenames = await Promise.all(
        files.map(async (file) => {
            const filename = path.join(startPath, file);
            const stat = await fs.lstat(filename);

            if (stat.isDirectory()) {
                return filesFromDir(filename, filter); // Recurse directory
            }
            if (filename.indexOf(filter) >= 0) {
                return [filename];
            }
            return [];
        }),
    );
    return filenames.flat();
}
