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
import { isConcreteEntity } from "../../utils/is-concrete-entity";
import { wrapSubqueriesInCypherCalls } from "../../utils/wrap-subquery-in-calls";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { Filter } from "../filters/Filter";
import type { AuthorizationFilters } from "../filters/authorization-filters/AuthorizationFilters";
import type { InputField } from "../input-fields/InputField";
import { ParamInputField } from "../input-fields/ParamInputField";
import type { SelectionPattern } from "../selection/SelectionPattern/SelectionPattern";
import { MutationOperation, type OperationTranspileResult } from "./operations";

export class DisconnectOperation extends MutationOperation {
    public readonly target: ConcreteEntityAdapter;
    public readonly relationship: RelationshipAdapter;

    private selectionPattern: SelectionPattern;
    protected readonly authFilters: AuthorizationFilters[] = [];
    protected readonly sourceAuthFilters: AuthorizationFilters[] = [];

    public readonly inputFields: Map<string, InputField> = new Map();
    private filters: Filter[] = [];

    private nestedContext: QueryASTContext | undefined;

    constructor({
        target,
        relationship,
        selectionPattern,
    }: {
        target: ConcreteEntityAdapter;
        selectionPattern: SelectionPattern;
        relationship: RelationshipAdapter;
    }) {
        super();
        this.target = target;
        this.relationship = relationship;
        this.selectionPattern = selectionPattern;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([
            this.selectionPattern,
            ...this.filters,
            ...this.authFilters,
            ...this.inputFields.values(),
        ]);
    }

    public print(): string {
        return `${super.print()} <${this.target.name}>`;
    }

    public addAuthFilters(...filter: AuthorizationFilters[]) {
        this.authFilters.push(...filter);
    }
    public addSourceAuthFilters(...filter: AuthorizationFilters[]) {
        this.sourceAuthFilters.push(...filter);
    }

    /**
     * Get and set field methods are utilities to remove duplicate fields between separate inputs
     */
    public getField(key: string, attachedTo: "node" | "relationship") {
        return this.inputFields.get(`${attachedTo}_${key}`);
    }

    public addField(field: InputField, attachedTo: "node" | "relationship") {
        if (!this.inputFields.has(field.name)) {
            this.inputFields.set(`${attachedTo}_${field.name}`, field);
        }
    }

    public addFilters(...filters: Filter[]): void {
        this.filters.push(...filters);
    }

    public getAuthorizationSubqueries(_context: QueryASTContext): Cypher.Clause[] {
        const nestedContext = this.nestedContext;

        if (!nestedContext) {
            throw new Error(
                "Error parsing query, nested context not available, need to call transpile first. Please contact support"
            );
        }

        return [...this.inputFields.values()].flatMap((inputField) => {
            return inputField.getAuthorizationSubqueries(nestedContext);
        });
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        if (!context.hasTarget()) {
            throw new Error("No parent node found!");
        }

        const { nestedContext, pattern: matchPattern } = this.selectionPattern.apply(context);
        this.nestedContext = nestedContext;

        checkEntityAuthentication({
            context: nestedContext.neo4jGraphQLContext,
            entity: this.target.entity,
            targetOperations: ["DELETE_RELATIONSHIP"],
        });
        if (isConcreteEntity(this.relationship.source)) {
            checkEntityAuthentication({
                context: nestedContext.neo4jGraphQLContext,
                entity: this.relationship.source.entity,
                targetOperations: ["DELETE_RELATIONSHIP"],
            });
        }
        this.inputFields.forEach((field) => {
            if (field.attachedTo === "node" && field instanceof ParamInputField) {
                checkEntityAuthentication({
                    context: nestedContext.neo4jGraphQLContext,
                    entity: this.target.entity,
                    targetOperations: ["DELETE_RELATIONSHIP"],
                    field: field.name,
                });
            }
        });

        const allFilters = [...this.authFilters, ...this.filters];

        const filterSubqueries = wrapSubqueriesInCypherCalls(nestedContext, allFilters, [nestedContext.target]);

        const predicate = Cypher.and(...allFilters.map((f) => f.getPredicate(nestedContext)));
        let matchClause: Cypher.Clause;
        if (filterSubqueries.length > 0) {
            matchClause = Cypher.utils.concat(
                new Cypher.OptionalMatch(matchPattern),
                ...filterSubqueries,
                new Cypher.With("*").where(predicate)
            );
        } else {
            matchClause = new Cypher.OptionalMatch(matchPattern).where(predicate);
        }

        const relVar = new Cypher.Relationship();

        const disconnectContext = context.push({ target: nestedContext.target, relationship: relVar });

        const mutationSubqueries = Array.from(this.inputFields.values())
            .flatMap((input) => {
                return input.getSubqueries(disconnectContext);
            })
            .map((sq) => new Cypher.Call(sq, [disconnectContext.target]));

        const deleteClause = new Cypher.With("*").delete(nestedContext.relationship!);

        const clauses = Cypher.utils.concat(
            matchClause,
            ...this.getAuthorizationClauses(nestedContext),
            ...this.getSourceAuthorizationClauses(context, "BEFORE"),
            ...mutationSubqueries,
            deleteClause,
            ...this.getAuthorizationClausesAfter(nestedContext),
            ...this.getSourceAuthorizationClauses(context, "AFTER")
        );

        const callClause = new Cypher.Call(clauses, [context.target]);

        return {
            projectionExpr: context.returnVariable,
            clauses: [callClause],
        };
    }

    private getAuthorizationClauses(context: QueryASTContext): Cypher.Clause[] {
        const { subqueries, validations } = this.transpileAuthClauses(context);
        if (!validations.length) {
            return [];
        }
        return [...subqueries, ...validations];
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

    private getSourceAuthorizationClauses(context: QueryASTContext, when: "BEFORE" | "AFTER"): Cypher.Clause[] {
        const validations: Cypher.VoidProcedure[] = [];
        for (const authFilter of this.sourceAuthFilters) {
            const validation = authFilter.getValidation(context, when);
            if (validation) {
                validations.push(validation);
            }
        }

        if (validations.length > 0) {
            return [new Cypher.With("*"), ...validations];
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
            const validation = authFilter.getValidation(context, "BEFORE");

            if (extraSelections) {
                selections.push(...extraSelections);
            }
            if (authSubqueries) {
                subqueries.push(...authSubqueries);
            }

            if (validation) {
                validations.push(validation);
            }
        }
        return { selections, subqueries, predicates, validations };
    }
}
