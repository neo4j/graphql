/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import { type QueryASTContext } from "../QueryASTContext";
import { EntitySelection, type SelectionClause } from "./EntitySelection";

export class UnwindSelection extends EntitySelection {
    constructor() {
        super();
    }

    public apply(context: QueryASTContext): {
        nestedContext: QueryASTContext<Cypher.Node>;
        selection: SelectionClause;
    } {
        if (!context.hasTarget()) {
            throw new Error(
                "Error generating query: context has no target in ConnectionReadOperation. This is likely a bug with the @neo4j/graphql library"
            );
        }
        if (!context.varTarget) {
            throw new Error(
                "Error generating query: context has no target in ConnectionReadOperation. This is likely a bug with the @neo4j/graphql library"
            );
        }

        const edgesVar = context.varTarget.property("aggregate");
        const edgeVar = new Cypher.NamedVariable("edge");
        const nodeProperty = edgeVar.property("node");

        const selection = new Cypher.Unwind([edgesVar, edgeVar]).with([nodeProperty, context.target]);

        return {
            selection,
            nestedContext: context,
        };
    }
}
