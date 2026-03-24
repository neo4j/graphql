/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { omitFields } from "../../../../src/utils/utils";
import type * as Performance from "../../types";
import { colorText, TTYColors } from "./color-tty-text";

type TTYTableItem = Partial<Performance.ProfileResult & { "time (ms)": number; error: string }>;

export class TTYFormatter {
    public format(
        results: Array<Performance.TestDisplayData>,
        oldResults: Record<string, Performance.TestDisplayData> | undefined
    ): Record<string, TTYTableItem> {
        return this.parseForTTYTable(results, oldResults);
    }

    private parseForTTYTable(
        results: Array<Performance.TestDisplayData>,
        oldResults: Record<string, Performance.TestDisplayData> | undefined
    ): Record<string, TTYTableItem> {
        return results.reduce((acc: Record<string, TTYTableItem>, displayData) => {
            if (displayData.error !== undefined) {
                const [key, item] = this.formatErrorItem(displayData);
                acc[key] = item;
            } else {
                const [key, item] = this.formatTableItem(displayData, oldResults);
                acc[key] = item;
            }
            return acc;
        }, {});
    }

    private formatTableItem(
        { name, result, file, type }: Performance.CorrectDisplayData,
        oldResults: Record<string, Performance.TestDisplayData> | undefined
    ): [string, TTYTableItem] {
        const oldResult = oldResults ? oldResults[`${file}.${name}`] : undefined;

        let testColor: TTYColors | undefined;

        const tableResult = {
            ...omitFields(result, ["time"]),
            "time (ms)": result.time,
        } as Performance.ProfileResult & { "time (ms)": number };

        if (oldResults) {
            testColor = this.getOldResultComparisonColor(tableResult, oldResult);
        }

        const tableFileText = this.formatFileName({ name, file, type }, testColor);
        return [tableFileText, tableResult];
    }

    private formatErrorItem({ name, error, file, type }: Performance.ErroredDisplayData): [string, TTYTableItem] {
        const tableFileText = this.formatFileName({ name, file, type }, TTYColors.red);
        const errorLabel = colorText("[ERROR]", TTYColors.red);

        let errorMsg = error;
        const maxErrorSize = 70;
        if (error.length > maxErrorSize) {
            errorMsg = `${error.substring(0, maxErrorSize - 3)}...`;
        }

        return [
            `${tableFileText} ${errorLabel}`,
            {
                error: errorMsg,
            },
        ];
    }

    private getOldResultComparisonColor(
        tableResult: Performance.ProfileResult & { "time (ms)": number },
        oldResult: Performance.TestDisplayData | undefined
    ): TTYColors | undefined {
        if (oldResult && oldResult.error === undefined) {
            if (this.lessThan(tableResult.dbHits, oldResult.result.dbHits, 0.1)) {
                return TTYColors.green;
            } else if (this.moreThan(tableResult.dbHits, oldResult.result.dbHits, 0.1)) {
                return TTYColors.red;
            }
            return undefined;
        }
        return TTYColors.magentaBackground;
    }

    private formatFileName(
        { name, file, type }: Pick<Performance.TestDisplayData, "name" | "file" | "type">,
        nameColor?: TTYColors
    ): string {
        const highlightedFile = colorText(file, TTYColors.yellow);

        const highlightedOnly = colorText("_only", TTYColors.cyan);
        let displayName = name.replace(/_only$/i, highlightedOnly);

        let typeStr = "";
        if (type === "cypher") {
            typeStr = colorText("[cypher]", TTYColors.cyan);
        }

        if (nameColor) {
            displayName = colorText(displayName, nameColor);
        }

        return `${typeStr} ${highlightedFile}.${displayName}`;
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
