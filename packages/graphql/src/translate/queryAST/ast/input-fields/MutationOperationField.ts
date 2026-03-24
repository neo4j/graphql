/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type Cypher from "@neo4j/cypher-builder";
import type { QueryASTContext } from "../QueryASTContext";
import type { MutationOperation } from "../operations/operations";
import { InputField } from "./InputField";

/** Input field wrapping a nested mutation operation
 * @example
 * ```
 * actors: { connect: [{ where: { node: { name: { eq: "Dan" } } } }] }
 * ```
 */
export class MutationOperationField extends InputField {
    public mutationOperation: MutationOperation;

    /**
     * @param fieldName - Used for debugging only
     */
    constructor(mutationOperation: MutationOperation, fieldName: string = "") {
        super(fieldName);
        this.mutationOperation = mutationOperation;
    }

    public getChildren() {
        return [this.mutationOperation];
    }

    public getSetParams(): Cypher.SetParam[] {
        return [];
    }

    public getAuthorizationSubqueries(queryASTContext: QueryASTContext): Cypher.Clause[] {
        return this.mutationOperation.getAuthorizationSubqueries(queryASTContext);
    }

    public getSubqueries(queryASTContext: QueryASTContext): Cypher.Clause[] {
        const { clauses } = this.mutationOperation.transpile(queryASTContext);
        return clauses;
    }
}
