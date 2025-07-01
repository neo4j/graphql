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

/**
 * This is currently just a dummy tree node,
 * The whole mutation part is still implemented in the old way, the current scope of this node is just to contains the nested fields.
 **/
export class CreateOperation extends MutationOperation {
    public readonly target: ConcreteEntityAdapter;
    public readonly relationship: RelationshipAdapter | undefined;

    private selectionPattern: SelectionPattern;

    // The response fields in the mutation, currently only READ operations are supported in the MutationResponse
    private projectionOperations: OperationField[] = [];

    public readonly inputFields: InputField[] = [];

    protected readonly authFilters: AuthorizationFilters[] = [];
    private readonly variable: Cypher.Variable;

    private nestedContext: QueryASTContext | undefined;

    constructor({
        target,
        relationship,
        selectionPattern,
    }: {
        target: ConcreteEntityAdapter;
        selectionPattern: SelectionPattern;
        relationship?: RelationshipAdapter;
    }) {
        super();
        this.target = target;
        this.relationship = relationship;
        this.selectionPattern = selectionPattern;
        this.variable = new Cypher.Variable();
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

    /**
     * Get and set field methods are utilities to remove duplicate fields between separate inputs
     * TODO: This logic should be handled in the factory.
     */
    public getField(_key: string, _attachedTo: "node" | "relationship") {
        // return this.inputFields.get(`${attachedTo}_${key}`);
        return undefined;
    }

    public addField(field: InputField, _attachedTo: "node" | "relationship") {
        // if (!this.inputFields.has(field.name)) {
        //     this.inputFields.set(`${attachedTo}_${field.name}`, field);
        // }
        this.inputFields.push(field);
    }

    public getCypherVariable(): Cypher.Variable {
        return this.variable;
    }

    public addProjectionOperations(operations: OperationField[]) {
        this.projectionOperations.push(...operations);
    }

    /** Subqueries (auth) for the nested operation */
    public getSubqueries(_context: QueryASTContext): Cypher.Clause[] {
        if (!this.nestedContext) {
            throw new Error(
                "Error parsing query, nested context not available, need to call transpile first. Please contact support"
            );
        }
        return this.getAuthorizationClauses(this.nestedContext);
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        if (!context.hasTarget()) {
            throw new Error("No parent node found!");
        }
        context.env.topLevelOperationName = "CREATE";
        // TODO: implement the actual create / unwind create

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

        const setParams = Array.from(this.inputFields.values()).flatMap((input) => {
            return input.getSetParams(nestedContext);
        });

        const mutationSubqueries = Array.from(this.inputFields.values())
            .flatMap((input) => {
                return input.getSubqueries(nestedContext);
            })
            .map((sq) => {
                return new Cypher.Call(sq, "*");
            });

        let mergeClause: Cypher.Merge | undefined;
        if (this.relationship) {
            const relVar = nestedContext.relationship;
            if (!relVar) {
                throw new Error(
                    "GraphQL Error: Transpilation Error, relationship variable not avaialbe. Please contact support"
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

        let withClause: Cypher.With | undefined;
        if (mutationSubqueries.length > 0) {
            withClause = new Cypher.With("*");
        }

        // TODO: this should be collected on the top level create
        const authorizationClauses = this.getAuthorizationClauses(nestedContext);

        const clauses = Cypher.utils.concat(
            createClause,
            withClause,
            ...mutationSubqueries,
            mergeClause,
            ...authorizationClauses,
            this.getProjectionClause(nestedContext)
        );
        return { projectionExpr: context.returnVariable, clauses: [clauses] };
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
            const validation = authFilter.getValidation(context);

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

    private getProjectionClause(context: QueryASTContext<Cypher.Node>): Cypher.Clause {
        const subqueries = this.projectionOperations
            .flatMap((operationField) => {
                return operationField.getSubqueries(context);
            })
            .map((sq) => new Cypher.Call(sq, [context.target]));

        const projectionFields = this.projectionOperations
            .map((f) => {
                return f.getProjectionField();
            })
            .flatMap((projectionMap) => {
                return Object.values(projectionMap);
            });

        let returnClause: Cypher.Clause | undefined;
        if (projectionFields.length > 0) {
            returnClause = new Cypher.Return([new Cypher.List(projectionFields), "data"]);
        }

        let extraWith: Cypher.With | undefined;
        if (subqueries.length > 0) {
            extraWith = new Cypher.With(context.target);
        }

        return Cypher.utils.concat(extraWith, ...subqueries, returnClause);
    }
}
