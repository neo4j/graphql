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
import { getEntityLabels } from "../../utils/create-node-from-entity";
import { wrapSubqueriesInCypherCalls } from "../../utils/wrap-subquery-in-calls";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { Filter } from "../filters/Filter";
import type { AuthorizationFilters } from "../filters/authorization-filters/AuthorizationFilters";
import type { InputField } from "../input-fields/InputField";
import type { SelectionPattern } from "../selection/SelectionPattern/SelectionPattern";
import { MutationOperation, type OperationTranspileResult } from "./operations";

export class ConnectOperation extends MutationOperation {
    public readonly target: ConcreteEntityAdapter;
    public readonly relationship: RelationshipAdapter;

    private selectionPattern: SelectionPattern;
    protected readonly authFilters: AuthorizationFilters[] = [];

    public readonly inputFields: Map<string, InputField> = new Map();
    private filters: Filter[] = [];

    private nestedContext: QueryASTContext | undefined;

    private connectedElement = new Cypher.Variable();

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

    public getProjectionFields(): Cypher.Expr[] {
        const nestedFields = this.getNestedProjectionFields();

        nestedFields.push(this.connectedElement);
        return nestedFields;
    }

    private getNestedProjectionFields(): Cypher.Expr[] {
        return [...this.inputFields.values()].flatMap((field) => {
            return field.getProjectionFields();
        });
    }

    /**
     * Get and set field methods are utilities to remove duplicate fields between separate inputs
     * TODO: This logic should be handled in the factory.
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

        if (!nestedContext || !nestedContext.hasTarget()) {
            throw new Error(
                "Error parsing query, nested context not available, need to call transpile first. Please contact support"
            );
        }

        const authSubqueries = [...this.inputFields.values()].flatMap((inputField) => {
            return inputField.getAuthorizationSubqueries(nestedContext);
        });

        const afterAuthClauses = this.getAuthorizationClausesAfter(nestedContext);
        if (afterAuthClauses.length > 0) {
            authSubqueries.push(Cypher.utils.concat(...afterAuthClauses));
        }
        return authSubqueries;
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        if (!context.hasTarget()) {
            throw new Error("No parent node found!");
        }

        const { nestedContext } = this.selectionPattern.apply(context);
        this.nestedContext = nestedContext;

        const matchPattern = new Cypher.Pattern(nestedContext.target, {
            labels: getEntityLabels(this.target, context.neo4jGraphQLContext),
        });

        const allFilters = [...this.authFilters, ...this.filters];

        const filterSubqueries = wrapSubqueriesInCypherCalls(nestedContext, allFilters, [nestedContext.target]);

        let matchClause: Cypher.Clause;
        if (filterSubqueries.length > 0) {
            const predicate = Cypher.and(...allFilters.map((f) => f.getPredicate(nestedContext)));
            matchClause = Cypher.utils.concat(
                new Cypher.Match(matchPattern),
                ...filterSubqueries,
                new Cypher.With("*").where(predicate)
            );
        } else {
            const predicate = Cypher.and(...allFilters.map((f) => f.getPredicate(nestedContext)));
            matchClause = new Cypher.Match(matchPattern).where(predicate);
        }

        const relVar = new Cypher.Relationship();

        const relDirection = this.relationship.getCypherDirection();

        const connectPattern = new Cypher.Pattern(context.target)
            .related(relVar, { direction: relDirection, type: this.relationship.type })
            .to(nestedContext.target);

        const connectContext = context.push({ target: nestedContext.target, relationship: relVar });

        const connectClause = new Cypher.Create(connectPattern);

        const setParams = Array.from(this.inputFields.values()).flatMap((input) => {
            return input.getSetParams(connectContext);
        });
        connectClause.set(...setParams);

        const mutationSubqueries = Array.from(this.inputFields.values()).flatMap((input) => {
            return input.getSubqueries(connectContext);
        });

        const nestedProjection = this.getNestedProjectionFields();

        const clauses = Cypher.utils.concat(
            matchClause,
            ...this.getAuthorizationClauses(nestedContext), // THESE ARE "BEFORE" AUTH
            ...mutationSubqueries,
            connectClause,
            new Cypher.Return([Cypher.collect(nestedContext.target), this.connectedElement], ...nestedProjection) // This is not needed if there are no auth!!
        );

        const callClause = new Cypher.Call(clauses, [context.target]);

        return { projectionExpr: context.returnVariable, clauses: [callClause] };
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

    private getAuthorizationClausesAfter(context: QueryASTContext<Cypher.Node>): Cypher.Clause[] {
        const validationsAfter: Cypher.VoidProcedure[] = [];
        for (const authFilter of this.authFilters) {
            const validationAfter = authFilter.getValidation(context, "AFTER");
            if (validationAfter) {
                validationsAfter.push(validationAfter);
            }
        }

        if (validationsAfter.length > 0) {
            return [new Cypher.Unwind([this.connectedElement, context.target]), ...validationsAfter];
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
