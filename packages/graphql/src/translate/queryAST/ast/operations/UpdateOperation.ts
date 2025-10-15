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
import { filterTruthy } from "../../../../utils/utils";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { ReadOperation } from "./ReadOperation";
import { Operation, type OperationTranspileResult } from "./operations";
import type { InputField } from "../input-fields/InputField";
import type { AuthorizationFilters } from "../filters/authorization-filters/AuthorizationFilters";
import type { SelectionPattern } from "../selection/SelectionPattern/SelectionPattern";
import { checkEntityAuthentication } from "../../../authorization/check-authentication";

import { ParamInputField } from "../input-fields/ParamInputField";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { getEntityLabels } from "../../utils/create-node-from-entity";
import type { Filter } from "../filters/Filter";
import { wrapSubqueriesInCypherCalls } from "../../utils/wrap-subquery-in-calls";

/**
 * This is currently just a dummy tree node,
 * The whole mutation part is still implemented in the old way, the current scope of this node is just to contains the nested fields.
 **/
export class UpdateOperation extends Operation {
    public readonly target: ConcreteEntityAdapter;
    public readonly relationship: RelationshipAdapter | undefined;

    protected readonly authFilters: AuthorizationFilters[] = [];
    protected filters: Filter[] = [];

    private readonly selectionPattern: SelectionPattern;
    private readonly inputFields: InputField[] = [];
    // The response fields in the mutation, currently only READ operations are supported in the MutationResponse
    public projectionOperations: ReadOperation[] = [];
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
            ...this.filters,
            ...this.authFilters,
            ...this.projectionOperations,
        ]);
    }

    public addProjectionOperations(operations: ReadOperation[]) {
        this.projectionOperations.push(...operations);
    }

    public addAuthFilters(...filter: AuthorizationFilters[]) {
        this.authFilters.push(...filter);
    }

    public addField(field: InputField) {
        this.inputFields.push(field);
    }

    public addFilters(...filters: Filter[]) {
        this.filters.push(...filters);
    }
    public transpile(context: QueryASTContext): OperationTranspileResult {
        if (!context.target) throw new Error("No parent node found!");
        context.env.topLevelOperationName = "UPDATE";

        const { nestedContext } = this.selectionPattern.apply(context);
        this.nestedContext = nestedContext;

        const predicate = this.getPredicate(context);

        const filterSubqueries = wrapSubqueriesInCypherCalls(context, this.filters, [context.target]);
        let filterSubqueriesClause: Cypher.Clause | undefined;
        if (filterSubqueries.length > 0) {
            filterSubqueriesClause = Cypher.utils.concat(...filterSubqueries);
        }

        checkEntityAuthentication({
            context: context.neo4jGraphQLContext,
            entity: this.target.entity,
            targetOperations: ["UPDATE"],
        });
        this.inputFields.forEach((field) => {
            if (field.attachedTo === "node" && field instanceof ParamInputField) {
                checkEntityAuthentication({
                    context: context.neo4jGraphQLContext,
                    entity: this.target.entity,
                    targetOperations: ["UPDATE"],
                    field: field.name,
                });
            }
        });

        // const createPattern = new Cypher.Pattern(nestedContext.target, {
        //     labels: getEntityLabels(this.target, context.neo4jGraphQLContext),
        // });

        // const createClause = new Cypher.Create(createPattern);

        const matchPattern = new Cypher.Pattern(context.target, {
            labels: getEntityLabels(this.target, context.neo4jGraphQLContext),
        });

        const matchClause = new Cypher.Match(matchPattern).where(predicate);

        const setParams = Array.from(this.inputFields.values()).flatMap((input) => {
            return input.getSetParams(context);
        });

        const mutationSubqueries = Array.from(this.inputFields.values()).flatMap((input) => {
            return input.getSubqueries(context);
        });

        let mergeClause: Cypher.Merge | undefined;
        if (this.relationship) {
            const relVar = context.relationship;
            if (!relVar) {
                throw new Error(
                    "GraphQL Error: Transpilation Error, relationship variable not available. Please contact support"
                );
            }
            const relDirection = this.relationship.getCypherDirection();

            const mergePattern = new Cypher.Pattern(context.target)
                .related(relVar, { direction: relDirection, type: this.relationship.type })
                .to(context.target);
            mergeClause = new Cypher.Merge(mergePattern).set(...setParams);
        } else {
            // createClause.set(...setParams);
            matchClause.set(...setParams);
        }

        const clauses = Cypher.utils.concat(
            // createClause,
            matchClause,
            filterSubqueriesClause,
            ...mutationSubqueries.map((sq) => Cypher.utils.concat(new Cypher.With("*"), sq)),
            mergeClause
        );

        return { projectionExpr: context.target, clauses: [clauses] };

        // OLD
        // const clauses = this.getProjectionClause(context);
        // return { projectionExpr: context.returnVariable, clauses };
    }

    // OLD
    // private getProjectionClause(context: QueryASTContext): Cypher.Clause[] {
    //     return this.projectionOperations.map((operationField) => {
    //         return Cypher.utils.concat(...operationField.transpile(context).clauses);
    //     });
    // }

    /** Post subqueries */
    public getAuthorizationSubqueries(_context: QueryASTContext): Cypher.Clause[] {
        const nestedContext = this.nestedContext;

        if (!nestedContext) {
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

    private getAuthorizationClauses(context: QueryASTContext): Cypher.Clause[] {
        const { selections, subqueries, predicates, validations } = this.transpileAuthClauses(context);
        const predicate = Cypher.and(...predicates);
        const lastSelection = selections[selections.length - 1];

        if (!predicates.length && !validations.length) {
            return [];
        } else {
            if (lastSelection) {
                lastSelection.where(predicate);
                return [...subqueries, new Cypher.With("*"), ...selections, ...validations];
            }
            return [...subqueries, new Cypher.With("*").where(predicate), ...selections, ...validations];
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

    private getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        const authBeforePredicates = this.getAuthFilterPredicate(queryASTContext);
        return Cypher.and(...this.filters.map((f) => f.getPredicate(queryASTContext)), ...authBeforePredicates);
    }

    private getAuthFilterPredicate(context: QueryASTContext): Cypher.Predicate[] {
        return filterTruthy(this.authFilters.map((f) => f.getPredicate(context)));
    }
}
