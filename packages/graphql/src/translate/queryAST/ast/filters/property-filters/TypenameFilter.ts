/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { ConcreteEntityAdapter } from "../../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { hasTarget } from "../../../utils/context-has-target";
import { getEntityLabels } from "../../../utils/create-node-from-entity";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import { Filter } from "../Filter";

export class TypenameFilter extends Filter {
    private readonly acceptedEntities: ConcreteEntityAdapter[];

    constructor(acceptedEntities: ConcreteEntityAdapter[]) {
        super();
        this.acceptedEntities = acceptedEntities;
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    public print(): string {
        const acceptedEntities = this.acceptedEntities.map((e) => e.name);
        return `${super.print()} [${acceptedEntities.join(", ")}]`;
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        if (!hasTarget(queryASTContext)) throw new Error("No parent node found!");
        const labelPredicate = this.acceptedEntities.map((e) => {
            const labels = getEntityLabels(e, queryASTContext.neo4jGraphQLContext);
            return queryASTContext.target.hasLabels(...labels);
        });
        return Cypher.or(...labelPredicate);
    }
}
