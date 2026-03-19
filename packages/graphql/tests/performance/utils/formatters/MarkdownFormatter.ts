/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type * as Performance from "../../types";

export class MarkdownFormatter {
    public format(
        results: Array<Performance.TestDisplayData>,
        oldResults: Record<string, Performance.TestDisplayData> | undefined
    ): string {
        const { table: diffTable, rows: diffRows } = this.createTable(results, oldResults || {}, true);
        const { table: nonDiffTable } = this.createTable(results, oldResults || {}, false);

        const legend = diffRows
            ? `
🟥 - Performance worsened (dbHits)
🟩 - Performance improved (dbHits)
🟦 - New test
        `
            : "";

        const markdownMessage = `
# Performance Report

${diffRows ? diffTable : "No Performance Changes"}
${legend}

<details>
    <summary>Show Full Table</summary>
    
${nonDiffTable}
</details>
        `;

        return markdownMessage;
    }

    private createTable(
        data: Performance.TestDisplayData[],
        comparisonData: Record<string, Performance.TestDisplayData>,
        diffOnly: boolean
    ): { table: string; rows: number } {
        let table = "";
        let rows = 0;
        table += "| name | dbHits | old dbHits | time (ms) | old time (ms) | maxRows |\n";
        table += "| ---- | ------ | ---------- | --------- | ------------- | ------- |\n";

        for (const item of data) {
            const key = `${item.file}.${item.name}`;

            if (item.error !== undefined) {
                const errorPrefix = "❌";
                table += `| ${errorPrefix} ${key} [ERROR] | N/A | N/A  | N/A  | N/A | N/A |\n`;
                rows += 1;
            } else {
                let prefix = "";

                const comparisonItem = comparisonData[key];
                if (comparisonItem && comparisonItem.error === undefined) {
                    const diff = item.result.dbHits - comparisonItem.result.dbHits;
                    if (diff >= 0 && diff / comparisonItem.result.dbHits >= 0.1) {
                        prefix = "🟥";
                    } else if (diff < 0 && -diff / comparisonItem.result.dbHits >= 0.1) {
                        prefix = "🟩";
                    }
                } else {
                    prefix = "🟦";
                }

                if ((prefix && diffOnly) || !diffOnly) {
                    let oldTime = "N/A" as string | number;
                    let oldDbHits = "N/A" as string | number;
                    const comparisonItem = comparisonData[key];
                    if (comparisonItem && comparisonItem.error === undefined) {
                        oldTime = comparisonItem.result.time;
                        oldDbHits = comparisonItem.result.dbHits;
                    }

                    table += `| ${prefix} ${key} | ${item.result.dbHits} | ${oldDbHits} | ${item.result.time} | ${oldTime} | ${item.result.maxRows} |\n`;
                    rows += 1;
                }
            }
        }

        return { table, rows };
    }
}
