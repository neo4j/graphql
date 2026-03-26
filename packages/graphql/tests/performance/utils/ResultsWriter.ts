/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import * as fs from "fs/promises";
import type * as Performance from "../types";

export class ResultsWriter {
    public path: string;

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
