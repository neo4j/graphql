/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import { EntitySelection, type SelectionClause } from "./EntitySelection";
import { RelationshipSelectionPattern } from "./SelectionPattern/RelationshipSelectionPattern";

export class RelationshipSelection extends EntitySelection {
    private optional: boolean;

    private selectionPattern: RelationshipSelectionPattern;

    constructor({
        relationship,
        alias,
        targetOverride,
        optional,
    }: {
        relationship: RelationshipAdapter;
        alias?: string;
        directed?: boolean;
        targetOverride?: ConcreteEntityAdapter;
        optional?: boolean;
    }) {
        super();
        this.optional = optional ?? false;

        this.selectionPattern = new RelationshipSelectionPattern({
            relationship,
            alias,
            targetOverride,
        });
    }

    public getChildren(): QueryASTNode[] {
        return [...super.getChildren(), this.selectionPattern];
    }

    public apply(context: QueryASTContext<Cypher.Node>): {
        nestedContext: QueryASTContext<Cypher.Node>;
        selection: SelectionClause;
    } {
        const { nestedContext, pattern } = this.selectionPattern.apply(context);

        // NOTE: Direction not passed (can we remove it from context?)
        const match = new Cypher.Match(pattern);
        if (this.optional) {
            match.optional();
        }
        return {
            nestedContext: nestedContext,
            selection: match,
        };
    }
}
