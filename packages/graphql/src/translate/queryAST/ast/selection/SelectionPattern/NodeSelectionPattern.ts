/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { ConcreteEntityAdapter } from "../../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { createNode, getEntityLabels } from "../../../utils/create-node-from-entity";
import { QueryASTContext } from "../../QueryASTContext";
import { SelectionPattern } from "./SelectionPattern";

/** Generates a pattern to select a node */
export class NodeSelectionPattern extends SelectionPattern {
    private target: ConcreteEntityAdapter;
    private alias: string | undefined;
    private useContextTarget: boolean;

    constructor({
        target,
        alias,
        useContextTarget = false,
    }: {
        target: ConcreteEntityAdapter;
        alias?: string;
        useContextTarget?: boolean;
    }) {
        super();
        this.target = target;
        this.alias = alias;
        this.useContextTarget = useContextTarget;
    }

    public print(): string {
        return `${super.print()} <${this.target.name}>`;
    }

    public apply(context: QueryASTContext): {
        nestedContext: QueryASTContext<Cypher.Node>;
        pattern: Cypher.Pattern;
    } {
        let node: Cypher.Node;
        let matchPattern: Cypher.Pattern | undefined;

        // useContextTarget is used when you have to select a node already matched,
        // this could be simplified a lot, it's currently not possible as there is no way to build a Cypher.Node from an existing Cypher.Node.
        if (this.useContextTarget) {
            if (!context.hasTarget()) {
                throw new Error("No target found in the context");
            }
            node = context.target;
            matchPattern = new Cypher.Pattern(node);
        } else {
            node = createNode(this.alias);

            matchPattern = new Cypher.Pattern(node, {
                labels: getEntityLabels(this.target, context.neo4jGraphQLContext),
            });
        }

        return {
            pattern: matchPattern,
            nestedContext: new QueryASTContext({
                target: node,
                neo4jGraphQLContext: context.neo4jGraphQLContext,
                returnVariable: context.returnVariable,
                env: context.env,
                shouldCollect: context.shouldCollect,
            }),
        };
    }
}
