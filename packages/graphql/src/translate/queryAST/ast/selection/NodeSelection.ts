/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import { EntitySelection, type SelectionClause } from "./EntitySelection";
import { NodeSelectionPattern } from "./SelectionPattern/NodeSelectionPattern";

/** Selects a node using Match */
export class NodeSelection extends EntitySelection {
    private optional: boolean;

    private selectionPattern: NodeSelectionPattern;

    constructor({
        target,
        alias,
        optional = false,
        useContextTarget = false,
    }: {
        target: ConcreteEntityAdapter;
        alias?: string;
        optional?: boolean;
        useContextTarget?: boolean;
    }) {
        super();
        this.optional = optional;

        this.selectionPattern = new NodeSelectionPattern({
            target: target,
            alias: alias,
            useContextTarget: useContextTarget,
        });
    }

    public getChildren(): QueryASTNode[] {
        return [...super.getChildren(), this.selectionPattern];
    }

    public apply(context: QueryASTContext): {
        nestedContext: QueryASTContext<Cypher.Node>;
        selection: SelectionClause;
    } {
        const { pattern: matchPattern, nestedContext } = this.selectionPattern.apply(context);
        const match = new Cypher.Match(matchPattern);

        if (this.optional) {
            match.optional();
        }

        return {
            selection: match,
            nestedContext: nestedContext,
        };
    }
}
