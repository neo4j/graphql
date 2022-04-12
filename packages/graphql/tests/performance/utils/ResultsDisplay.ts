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

import { omitFields } from "../../../src/utils/utils";
import * as Performance from "../types";

enum TTYColors {
    yellow = "\x1b[33m",
    cyan = "\x1b[36m",
    red = "\x1b[31m",
    green = "\x1b[32m",
}

const TTYReset = "\x1b[0m";

export class ResultsDisplay {
    public display(
        results: Array<Performance.TestDisplayData>,
        oldResults: Record<string, Performance.TestDisplayData> | undefined
    ): Promise<void> {
        // eslint-disable-next-line no-console
        console.table(
            results.reduce((acc, { name, result, file }) => {
                const coloredFile = this.colorText(file, TTYColors.yellow);

                const coloredOnly = this.colorText("_only", TTYColors.cyan);
                let displayName = name.replace(/_only$/i, coloredOnly);

                const oldResult = oldResults ? oldResults[`${file}.${name}`] : undefined;

                const result2 = {
                    ...omitFields(result, ["time"]),
                    "time (ms)": result.time,
                } as Performance.ProfileResult & { "time (ms)": number };
                if (oldResult) {
                    if (this.lessThan(result2.dbHits, oldResult.result.dbHits, 0.1)) {
                        displayName = this.colorText(displayName, TTYColors.green);
                    } else if (this.moreThan(result2.dbHits, oldResult.result.dbHits, 0.1)) {
                        displayName = this.colorText(displayName, TTYColors.red);
                    }
                }

                acc[`${coloredFile}.${displayName}`] = result2;
                return acc;
            }, {})
        );
        return Promise.resolve();
    }

    private colorText(text: string, color: TTYColors): string {
        return `${color}${text}${TTYReset}`;
    }

    private moreThan(a: number, b: number, delta: number): boolean {
        const upperBound = b + b * delta;
        return a > upperBound;
    }

    private lessThan(a: number, b: number, delta: number): boolean {
        const lowerBound = b - b * delta;
        return a < lowerBound;
    }
}
