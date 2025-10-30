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

        const { nestedContext, pattern } = this.selectionPattern.apply(context);
        this.nestedContext = nestedContext;

        const beforeAuthFilters = this.authFilters.filter((af) => {
            return af.getValidation(nestedContext!, "BEFORE");
        });

        // console.log("beforeAuthFilters", beforeAuthFilters);

        const afterAuthFilters = this.authFilters.filter((af) => {
            return af.getValidation(nestedContext!, "AFTER");
        });

        const beforeAuthValidations = this.authFilters
            .map((af) => {
                return af.getValidation(nestedContext!, "BEFORE");
            })
            .filter((v) => v !== undefined);

        // console.log("beforeAuthValidations", beforeAuthValidations);

        const afterAuthValidations = this.authFilters
            .map((af) => {
                return af.getValidation(nestedContext!, "AFTER");
            })
            .filter((v) => v !== undefined);

        console.log("afterAuthValidations", afterAuthValidations);

        const allFilters = [...beforeAuthFilters, ...this.filters];
        // const allFilters = this.filters;
        // console.log("this.authFilters", this.authFilters, beforeAuthFilters);
        // We need to call the filter subqueries before predicate to handle aggregate filters
        const filterSubqueries = wrapSubqueriesInCypherCalls(nestedContext, allFilters, [nestedContext.target]);
        const afterFilterSubqueries = wrapSubqueriesInCypherCalls(nestedContext, afterAuthFilters, [
            nestedContext.target,
        ]);
        console.log("afterFilterSubqueries", afterFilterSubqueries);

        const predicate = this.getPredicate(nestedContext);

        const { selections, predicates: authBeforePredicates, validations } = this.transpileAuthClauses(context);
        const allPredicates = Cypher.and(predicate, ...authBeforePredicates);
        // console.log("validations", validations);

        const matchClause = new Cypher.Match(pattern);
        let filtersWith: Cypher.With | undefined;

        const hasFilterSubqueries = filterSubqueries.length > 0;
        if (hasFilterSubqueries) {
            filtersWith = new Cypher.With("*").where(allPredicates);
        } else {
            // matchClause.where(allPredicates);
            filtersWith = new Cypher.With("*").where(allPredicates);
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

        const setParams = Array.from(this.inputFields.values()).flatMap((input) => {
            return input.getSetParams(nestedContext);
        });

        const mutationSubqueries = Array.from(this.inputFields.values())
            .flatMap((input) => {
                const subqueries = input.getSubqueries(nestedContext);
                const authSubqueries = input.getAuthorizationSubqueries(nestedContext);
                if (authSubqueries.length > 0 || subqueries.length > 0) {
                    return Cypher.utils.concat(...subqueries, ...authSubqueries);
                }
                return undefined;
            })
            .filter((s) => s !== undefined);

        // This is a small optimisation, to avoid subqueries with no changes
        // Top level should still be generated for projection
        if (this.relationship) {
            if (setParams.length === 0 && mutationSubqueries.length === 0) {
                return { projectionExpr: nestedContext.target, clauses: [] };
            }
        }

        if (filtersWith) {
            filtersWith.set(...setParams);
            if (mutationSubqueries.length || afterFilterSubqueries.length || afterAuthValidations.length) {
                // if (mutationSubqueries.length || afterAuthValidations.length) {
                filtersWith.with("*");
            }
        } else {
            matchClause.set(...setParams);
        }

        // console.log("mutationSubqueries", mutationSubqueries);

        const clauses = Cypher.utils.concat(
            matchClause,
            // ...this.getAuthorizationClauses(nestedContext), // THESE ARE "BEFORE" AUTH
            ...filterSubqueries,
            ...beforeAuthValidations,
            filtersWith,
            ...mutationSubqueries.map((sq) => Cypher.utils.concat(new Cypher.With("*"), new Cypher.Call(sq, "*"))),
            // ...this.getAuthorizationClausesAfter(nestedContext) // THESE ARE "AFTER" AUTH
            ...afterFilterSubqueries,
            ...afterAuthValidations
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

        return [
            // ...this.getAuthorizationClauses(nestedContext),
            // ...this.inputFields.flatMap((inputField) => {
            //     return inputField.getAuthorizationSubqueries(nestedContext);
            // }),
        ];
    }

    private getAuthorizationClauses(context: QueryASTContext): Cypher.Clause[] {
        const { selections, subqueries, predicates, validations } = this.transpileAuthClauses(context);
        const predicate = Cypher.and(...predicates);
        const lastSelection = selections[selections.length - 1];

        const authSubqueries = subqueries.map((sq) => {
            return new Cypher.Call(sq, "*");
        });
        if (!predicates.length && !validations.length) {
            return [];
        } else {
            if (lastSelection) {
                lastSelection.where(predicate);
                return [...authSubqueries, new Cypher.With("*"), ...selections, ...validations];
            }
            return [...authSubqueries, new Cypher.With("*").where(predicate), ...selections, ...validations];
        }
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
            const authSubqueries = authFilter.getSubqueries(context);
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
        return Cypher.and(...this.filters.map((f) => f.getPredicate(queryASTContext)), ...authBeforePredicates);
    }

    private getAuthFilterPredicate(context: QueryASTContext): Cypher.Predicate[] {
        return filterTruthy(this.authFilters.map((f) => f.getPredicate(context)));
    }
}
