/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Directive } from "../types";

export class NodeDirective implements Directive {
    labels: string[] = [];

    addLabels(labels: string[]): void {
        if (!labels.length) {
            return;
        }
        this.labels = this.labels.concat(labels);
    }

    toString(): string {
        return this.labels.length ? `@node(labels: ["${this.labels.join('", "')}"])` : "@node";
    }
}
