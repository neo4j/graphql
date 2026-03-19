/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import { filterTruthy } from "../../../../utils/utils";
import type { OperationField } from "../fields/OperationField";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import { Operation, type OperationTranspileResult } from "./operations";
import type { UpdateOperation } from "./UpdateOperation";

/** Wrapper over TopLevelUpdateMutationOperation for top level update, that support multiple update operations
 * This extends Operation because we don't need the mutationOperation API for top level
 */
export class TopLevelUpdateMutationOperation extends Operation {
    // The response fields in the mutation, currently only READ operations are supported in the MutationResponse
    private readonly projectionOperations: OperationField[];

    private readonly updateOperations: UpdateOperation[] = [];

    constructor({
        updateOperations,
        projectionOperations,
    }: {
        updateOperations: UpdateOperation[];
        projectionOperations: OperationField[];
    }) {
        super();
        this.updateOperations = updateOperations;
        this.projectionOperations = projectionOperations;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([...this.updateOperations, ...this.projectionOperations]);
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        context.env.topLevelOperationName = "UPDATE";
        if (!context.hasTarget()) {
            throw new Error("No parent node found!");
        }
        const subqueries = this.updateOperations.map((field) => {
            const { clauses } = field.transpile(context);

            return Cypher.utils.concat(...clauses, ...field.getAuthorizationSubqueries(context));
        });

        const projection: Cypher.Clause = this.getProjectionClause(context);
        return {
            projectionExpr: context.returnVariable,
            clauses: [...subqueries, projection],
        };
    }

    private getProjectionClause(context: QueryASTContext<Cypher.Node>): Cypher.Clause {
        const projectionOperation = this.projectionOperations[0]; // TODO: multiple projection operations not supported

        if (!projectionOperation) {
            return new Cypher.Finish();
        }

        const result = projectionOperation.operation.transpile(context);

        const extraWith = new Cypher.With(context.target);
        return Cypher.utils.concat(extraWith, ...result.clauses);
    }
}
