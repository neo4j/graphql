/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Cypher from "@neo4j/cypher-builder";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { filterTruthy } from "../../../../utils/utils";
import { checkEntityAuthentication } from "../../../authorization/check-authentication";
import { getEntityLabels } from "../../utils/create-node-from-entity";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { OperationField } from "../fields/OperationField";
import type { AuthorizationFilters } from "../filters/authorization-filters/AuthorizationFilters";
import type { InputField } from "../input-fields/InputField";
import { ParamInputField } from "../input-fields/ParamInputField";
import type { SelectionPattern } from "../selection/SelectionPattern/SelectionPattern";
import { MutationOperation, type OperationTranspileResult } from "./operations";

export class CreateOperation extends MutationOperation {
    public readonly target: ConcreteEntityAdapter;
    public readonly relationship: RelationshipAdapter | undefined;

    protected readonly authFilters: AuthorizationFilters[] = [];

    private readonly selectionPattern: SelectionPattern;

    // The response fields in the mutation, currently only READ operations are supported in the MutationResponse
    private readonly projectionOperations: OperationField[] = [];

    private readonly inputFields: InputField[] = [];

    private nestedContext: QueryASTContext | undefined;

    constructor({
        target,
        relationship,
        selectionPattern,
    }: {
        target: ConcreteEntityAdapter;
        relationship?: RelationshipAdapter;
        selectionPattern: SelectionPattern;
    }) {
        super();
        this.target = target;
        this.relationship = relationship;
        this.selectionPattern = selectionPattern;
    }

    /** Prints the name of the Node */
    public print(): string {
        return `${super.print()} <${this.target.name}>`;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([
            this.selectionPattern,
            ...this.inputFields,
            ...this.authFilters,
            ...this.projectionOperations,
        ]);
    }

    public addAuthFilters(...filter: AuthorizationFilters[]) {
        this.authFilters.push(...filter);
    }

    public addField(field: InputField) {
        this.inputFields.push(field);
    }

    public addProjectionOperations(operations: OperationField[]) {
        this.projectionOperations.push(...operations);
    }

    public getAuthorizationSubqueries(_context: QueryASTContext): Cypher.Clause[] {
        const nestedContext = this.nestedContext;

        if (!nestedContext || !nestedContext.hasTarget()) {
            throw new Error(
                "Error parsing query, nested context not available, need to call transpile first. Please contact support"
            );
        }

        return [
            ...this.getAuthorizationClauses(nestedContext),
            ...this.inputFields.flatMap((inputField) => {
                return inputField.getAuthorizationSubqueries(nestedContext);
            }),
        ];
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        if (!context.hasTarget()) {
            throw new Error("No parent node found!");
        }
        context.env.topLevelOperationName = "CREATE";

        const { nestedContext } = this.selectionPattern.apply(context);
        this.nestedContext = nestedContext;
        checkEntityAuthentication({
            context: nestedContext.neo4jGraphQLContext,
            entity: this.target.entity,
            targetOperations: ["CREATE"],
        });
        this.inputFields.forEach((field) => {
            if (field.attachedTo === "node" && field instanceof ParamInputField) {
                checkEntityAuthentication({
                    context: nestedContext.neo4jGraphQLContext,
                    entity: this.target.entity,
                    targetOperations: ["CREATE"],
                    field: field.name,
                });
            }
        });

        const createPattern = new Cypher.Pattern(nestedContext.target, {
            labels: getEntityLabels(this.target, context.neo4jGraphQLContext),
        });

        const createClause = new Cypher.Create(createPattern);

        const setParams = this.inputFields.flatMap((input) => {
            return input.getSetParams(nestedContext);
        });

        const mutationSubqueries = this.inputFields.flatMap((input) => {
            return input.getSubqueries(nestedContext);
        });

        let mergeClause: Cypher.Merge | undefined;
        if (this.relationship) {
            const relVar = nestedContext.relationship;
            if (!relVar) {
                throw new Error(
                    "GraphQL Error: Transpilation Error, relationship variable not available. Please contact support"
                );
            }
            const relDirection = this.relationship.getCypherDirection();

            const mergePattern = new Cypher.Pattern(context.target)
                .related(relVar, { direction: relDirection, type: this.relationship.type })
                .to(nestedContext.target);
            mergeClause = new Cypher.Merge(mergePattern).set(...setParams);
        } else {
            createClause.set(...setParams);
        }

        const clauses = Cypher.utils.concat(
            createClause,
            ...mutationSubqueries.map((sq) => Cypher.utils.concat(new Cypher.With("*"), sq)),
            mergeClause
        );

        return { projectionExpr: nestedContext.target, clauses: [clauses] };
    }

    private getAuthorizationClauses(context: QueryASTContext<Cypher.Node>): Cypher.Clause[] {
        const { selections, subqueries, validations } = this.transpileAuthClauses(context);

        if (!validations.length) {
            return [];
        } else {
            return [
                Cypher.utils.concat(...subqueries.map((sq) => new Cypher.Call(sq, "*")), ...selections, ...validations),
            ];
        }
    }

    private transpileAuthClauses(context: QueryASTContext): {
        selections: (Cypher.With | Cypher.Match)[];
        subqueries: Cypher.Clause[];
        predicates: Cypher.Predicate[];
        validations: Cypher.VoidProcedure[];
    } {
        const selections: (Cypher.With | Cypher.Match)[] = [];
        const subqueries: Cypher.Clause[] = [];
        const predicates: Cypher.Predicate[] = [];
        const validations: Cypher.VoidProcedure[] = [];
        for (const authFilter of this.authFilters) {
            const extraSelections = authFilter.getSelection(context);
            const authSubqueries = authFilter.getSubqueries(context);
            const authPredicate = authFilter.getPredicate(context);
            const validation = authFilter.getValidation(context, "AFTER"); // CREATE only has AFTER auth
            if (extraSelections) {
                selections.push(...extraSelections);
            }
            if (authSubqueries) {
                subqueries.push(...authSubqueries);
            }
            if (authPredicate) {
                predicates.push(authPredicate);
            }
            if (validation) {
                validations.push(validation);
            }
        }
        return { selections, subqueries, predicates, validations };
    }
}
