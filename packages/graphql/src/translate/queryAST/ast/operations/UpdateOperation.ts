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
import { checkEntityAuthentication } from "../../../authorization/check-authentication";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { AuthorizationFilters } from "../filters/authorization-filters/AuthorizationFilters";
import type { InputField } from "../input-fields/InputField";
import type { SelectionPattern } from "../selection/SelectionPattern/SelectionPattern";
import type { ReadOperation } from "./ReadOperation";
import { Operation, type OperationTranspileResult } from "./operations";

import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { wrapSubqueriesInCypherCalls } from "../../utils/wrap-subquery-in-calls";
import type { Filter } from "../filters/Filter";
import { ParamInputField } from "../input-fields/ParamInputField";

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

        const { nestedContext, pattern } = this.selectionPattern.apply(context);
        this.nestedContext = nestedContext;

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

        const setParams = Array.from(this.inputFields.values()).flatMap((input) => {
            return input.getSetParams(nestedContext);
        });

        const mutationSubqueries = Array.from(this.inputFields.values())
            .flatMap((input) => {
                const subqueries = input.getSubqueries(nestedContext);
                const authSubqueries = input.getAuthorizationSubqueries(nestedContext);
                if (!authSubqueries.length && !subqueries.length) {
                    return undefined;
                }
                if (authSubqueries.length && subqueries.length) {
                    return Cypher.utils.concat(...subqueries, new Cypher.With("*"), ...authSubqueries);
                }
                return Cypher.utils.concat(...subqueries, ...authSubqueries);
            })
            .filter((s) => s !== undefined);

        // This is a small optimization, to avoid subqueries with no changes
        // Top level should still be generated for projection
        if (this.relationship) {
            if (setParams.length === 0 && mutationSubqueries.length === 0) {
                return { projectionExpr: nestedContext.target, clauses: [] };
            }
        }

        // We need to call the filter subqueries before predicate to handle aggregate filters
        const filterSubqueries = wrapSubqueriesInCypherCalls(nestedContext, this.filters, [nestedContext.target]);

        const authBeforeClauses = this.getAuthorizationClauses(nestedContext);

        const afterFilterSubqueries = this.authFilters
            .flatMap((af) => af.getSubqueriesAfter(nestedContext))
            .map((sq) => {
                return new Cypher.Call(sq, [nestedContext.target]);
            });

        const predicate = this.getPredicate(nestedContext);

        const matchClause = new Cypher.Match(pattern);
        const filtersWith = new Cypher.With("*").where(predicate);
        if (authBeforeClauses.length > 0) {
            filtersWith.with("*");
        }

        let withAndSet: Cypher.Clause | undefined;
        if (authBeforeClauses.length === 0) {
            filtersWith.set(...setParams);
        } else {
            withAndSet = new Cypher.With("*").set(...setParams);
        }

        const clauses = Cypher.utils.concat(
            matchClause,
            ...filterSubqueries,
            filtersWith,
            ...authBeforeClauses,
            withAndSet,
            afterFilterSubqueries.length > 0 ? new Cypher.With("*") : undefined,
            ...mutationSubqueries.map((sq) => Cypher.utils.concat(new Cypher.With("*"), new Cypher.Call(sq, "*"))),
            ...afterFilterSubqueries,
            ...this.getAuthorizationClausesAfter(nestedContext) // THESE ARE "AFTER" AUTH
        );

        return { projectionExpr: nestedContext.target, clauses: [clauses] };
    }

    /** Post subqueries */
    public getAuthorizationSubqueries(_context: QueryASTContext): Cypher.Clause[] {
        const nestedContext = this.nestedContext;

        if (!nestedContext) {
            throw new Error(
                "Error parsing query, nested context not available, need to call transpile first. Please contact support"
            );
        }

        return [];
    }

    private getAuthorizationClauses(context: QueryASTContext): Cypher.Clause[] {
        const { subqueries, validations } = this.transpileAuthClauses(context);
        const authSubqueries = subqueries.map((sq) => {
            return new Cypher.Call(sq, "*");
        });
        if (!validations.length) {
            return [];
        }
        return [...authSubqueries, ...validations];
    }

    private getAuthorizationClausesAfter(context: QueryASTContext): Cypher.Clause[] {
        const validationsAfter: Cypher.VoidProcedure[] = [];
        for (const authFilter of this.authFilters) {
            const validationAfter = authFilter.getValidation(context, "AFTER");
            if (validationAfter) {
                validationsAfter.push(validationAfter);
            }
        }

        if (validationsAfter.length > 0) {
            return [new Cypher.With("*"), ...validationsAfter];
        }
        return [];
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
            const authSubqueries = authFilter.getSubqueriesBefore(context);
            const authPredicate = authFilter.getPredicate(context);
            const validationBefore = authFilter.getValidation(context, "BEFORE");
            if (extraSelections) {
                selections.push(...extraSelections);
            }
            if (authSubqueries) {
                subqueries.push(...authSubqueries);
            }
            if (authPredicate) {
                predicates.push(authPredicate);
            }
            if (validationBefore) {
                validations.push(validationBefore);
            }
        }
        return { selections, subqueries, predicates, validations };
    }

    private getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        const authBeforePredicates = this.getAuthFilterPredicate(queryASTContext);
        return Cypher.and(
            ...this.filters.map((f) => f.getPredicate(queryASTContext)),
            ...this.inputFields.map((f) => f.getPredicate(queryASTContext)),
            ...authBeforePredicates
        );
    }

    private getAuthFilterPredicate(context: QueryASTContext): Cypher.Predicate[] {
        return filterTruthy(this.authFilters.map((f) => f.getPredicate(context)));
    }
}
