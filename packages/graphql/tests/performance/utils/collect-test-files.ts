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

export async function collectTests(
    rootPath: string
): Promise<Array<{ query: string; name: string; filename: string }>> {
    const files = await filesFromDir(rootPath, ".graphql");
    let onlyFilter = false;
    const onlyRegex = /_only$/i;
    const skipRegex = /_skip$/i;
    const testFilesData = await Promise.all(
        files.map(async (filePath) => {
            const fileData = await fs.readFile(filePath, "utf-8");
            const rawQueries = fileData.split(/^query\s/gm);
            rawQueries.shift();
            return rawQueries.map((query: string) => {
                const name = query.split(" {")[0].trim();
                if (name.match(onlyRegex)) onlyFilter = true;
                return {
                    query: `query ${query}`,
                    name,
                    filename: path.basename(filePath).split(path.extname(filePath))[0],
                };
            });
        })
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
        })
    );
    return filenames.flat();
}
