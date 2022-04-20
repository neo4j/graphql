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
import * as Performance from "../types";

export class ResultsWriter {
    private path: string;

    constructor(path: string) {
        this.path = path;
    }

    public async readPreviousResults(): Promise<Record<string, Performance.TestDisplayData> | undefined> {
        try {
            const oldResults = await this.getTestData();
            return oldResults.reduce((acc, result) => {
                acc[`${result.file}.${result.name}`] = result;
                return acc;
            }, {} as Record<string, Performance.TestDisplayData>);
        } catch {
            return undefined;
        }
    }

    public writeResult(results: Array<Performance.TestDisplayData>): Promise<void> {
        return fs.writeFile(this.path, JSON.stringify(results, null, 4));
    }

    private async getTestData(): Promise<Performance.TestDisplayData[]> {
        const rawFile = await fs.readFile(this.path, "utf-8");
        return JSON.parse(rawFile) as Array<Performance.TestDisplayData>;
    }
}
