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
import { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { checkEntityAuthentication } from "../../../authorization/check-authentication";
import { createRelationshipValidationClauses } from "../../../create-relationship-validation-clauses";
import { getEntityLabels } from "../../utils/create-node-from-entity";
import { assertIsConcreteEntity } from "../../utils/is-concrete-entity";
import { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { AuthorizationFilters } from "../filters/authorization-filters/AuthorizationFilters";
import type { InputField } from "../input-fields/InputField";
import { PropertyInputField } from "../input-fields/PropertyInputField";
import type { ReadOperation } from "./ReadOperation";
import type { OperationTranspileResult } from "./operations";
import { MutationOperation } from "./operations";

export class UnwindCreateOperation extends MutationOperation {
    public readonly inputFields: Map<string, InputField>;
    public readonly target: ConcreteEntityAdapter | RelationshipAdapter;
    public readonly projectionOperations: ReadOperation[] = [];
    protected readonly authFilters: AuthorizationFilters[] = [];
    private readonly argumentToUnwind: Cypher.Param | Cypher.Property;
    private readonly unwindVariable: Cypher.Variable;
    private isNested: boolean;

    constructor({
        target,
        argumentToUnwind,
    }: {
        target: ConcreteEntityAdapter | RelationshipAdapter;
        argumentToUnwind: Cypher.Param | Cypher.Property;
    }) {
        super();
        this.target = target;
        this.inputFields = new Map();
        this.argumentToUnwind = argumentToUnwind;
        this.unwindVariable = new Cypher.Variable();
        this.isNested = target instanceof RelationshipAdapter;
    }
    public getChildren(): QueryASTNode[] {
        return [...this.inputFields.values(), ...this.authFilters, ...this.projectionOperations];
    }

    public addAuthFilters(...filter: AuthorizationFilters[]) {
        this.authFilters.push(...filter);
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

    public getUnwindVariable(): Cypher.Variable {
        return this.unwindVariable;
    }

    public addProjectionOperations(operations: ReadOperation[]) {
        this.projectionOperations.push(...operations);
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        const nestedContext = this.getNestedContext(context);
        nestedContext.env.topLevelOperationName = "CREATE";

        if (!nestedContext.hasTarget()) {
            throw new Error("No parent node found!");
        }
        const target = this.getTarget();
        checkEntityAuthentication({
            context: nestedContext.neo4jGraphQLContext,
            entity: target.entity,
            targetOperations: ["CREATE"],
        });
        this.inputFields.forEach((field) => {
            if (field.attachedTo === "node" && field instanceof PropertyInputField)
                checkEntityAuthentication({
                    context: nestedContext.neo4jGraphQLContext,
                    entity: target.entity,
                    targetOperations: ["CREATE"],
                    field: field.name,
                });
        });
        const unwindClause = new Cypher.Unwind([this.argumentToUnwind, this.unwindVariable]);

        const createClause = new Cypher.Create(
            new Cypher.Pattern(nestedContext.target, { labels: getEntityLabels(target, context.neo4jGraphQLContext) })
        );
        const setSubqueries: Cypher.Clause[] = [];
        const mergeClause: Cypher.Merge | undefined = this.getMergeClause(nestedContext);
        for (const field of this.inputFields.values()) {
            if (field.attachedTo === "relationship" && mergeClause) {
                mergeClause.set(...field.getSetParams(nestedContext, this.unwindVariable));
            } else if (field.attachedTo === "node") {
                createClause.set(...field.getSetParams(nestedContext, this.unwindVariable));
                setSubqueries.push(...field.getSubqueries(nestedContext));
            }
        }

        const nestedSubqueries = setSubqueries.flatMap((clause) => [
            new Cypher.With(nestedContext.target, this.unwindVariable),
            new Cypher.Call(clause).importWith(nestedContext.target, this.unwindVariable),
        ]);

        const authorizationClauses = this.getAuthorizationClauses(nestedContext);
        const cardinalityClauses = createRelationshipValidationClauses({
            entity: target,
            context: nestedContext.neo4jGraphQLContext,
            varName: nestedContext.target,
        });
        const unwindCreateClauses = Cypher.concat(
            createClause,
            mergeClause,
            ...nestedSubqueries,
            ...authorizationClauses,
            ...(cardinalityClauses.length ? [new Cypher.With(nestedContext.target), ...cardinalityClauses] : [])
        );

        let subQueryClause: Cypher.Clause;
        if (this.isNested) {
            subQueryClause = Cypher.concat(
                unwindCreateClauses,
                new Cypher.Return([Cypher.collect(Cypher.Null), new Cypher.Variable()])
            );
        } else {
            subQueryClause = new Cypher.Call(
                Cypher.concat(unwindCreateClauses, new Cypher.Return(nestedContext.target))
            ).importWith(this.unwindVariable);
        }
        const projectionContext = new QueryASTContext({
            ...nestedContext,
            target: nestedContext.target,
            returnVariable: new Cypher.NamedVariable("data"),
            shouldCollect: true,
        });
        const clauses = Cypher.concat(unwindClause, subQueryClause, ...this.getProjectionClause(projectionContext));
        return { projectionExpr: nestedContext.returnVariable, clauses: [clauses] };
    }

    private getMergeClause(context: QueryASTContext): Cypher.Merge | undefined {
        if (this.isNested) {
            if (!context.source || !context.relationship) {
                throw new Error("Transpile error: No source or relationship found!");
            }
            if (!(this.target instanceof RelationshipAdapter)) {
                throw new Error("Transpile error: Invalid target");
            }

            return new Cypher.Merge(
                new Cypher.Pattern(context.source)
                    .related(context.relationship, {
                        type: this.target.type,
                        direction: this.target.cypherDirectionFromRelDirection(),
                    })
                    .to(context.target)
            );
        }
    }

    private getTarget(): ConcreteEntityAdapter {
        if (this.target instanceof RelationshipAdapter) {
            const targetAdapter = this.target.target;
            assertIsConcreteEntity(targetAdapter);
            return targetAdapter;
        }
        return this.target;
    }

    protected getNestedContext(context: QueryASTContext): QueryASTContext {
        if (this.target instanceof RelationshipAdapter) {
            const target = new Cypher.Node();
            const relationship = new Cypher.Relationship();
            const nestedContext = context.push({
                target,
                relationship,
            });

            return nestedContext;
        }

        return context;
    }

    private getAuthorizationClauses(context: QueryASTContext): Cypher.Clause[] {
        const { selections, subqueries, predicates } = this.getAuthFilters(context);
        const lastSelection = selections[selections.length - 1];
        if (lastSelection) {
            lastSelection.where(Cypher.and(...predicates));
            return [...subqueries, new Cypher.With("*"), ...selections];
        }
        if (predicates.length) {
            return [...subqueries, new Cypher.With("*").where(Cypher.and(...predicates))];
        }
        return [...subqueries];
    }

    private getAuthFilters(context: QueryASTContext): {
        selections: (Cypher.With | Cypher.Match)[];
        subqueries: Cypher.Clause[];
        predicates: Cypher.Predicate[];
    } {
        const selections: (Cypher.With | Cypher.Match)[] = [];
        const subqueries: Cypher.Clause[] = [];
        const predicates: Cypher.Predicate[] = [];
        for (const authFilter of this.authFilters) {
            const extraSelections = authFilter.getSelection(context);
            const authSubqueries = authFilter.getSubqueries(context);
            const authPredicate = authFilter.getPredicate(context);
            if (extraSelections) {
                selections.push(...extraSelections);
            }
            if (authSubqueries) {
                subqueries.push(...authSubqueries);
            }
            if (authPredicate) {
                predicates.push(authPredicate);
            }
        }
        return { selections, subqueries, predicates };
    }

    private getProjectionClause(context: QueryASTContext): Cypher.Clause[] {
        if (this.projectionOperations.length === 0 && !this.isNested) {
            const emptyProjection = new Cypher.Literal("Query cannot conclude with CALL");
            return [new Cypher.Return(emptyProjection)];
        }
        return this.projectionOperations.map((operationField) => {
            return Cypher.concat(...operationField.transpile(context).clauses);
        });
    }
}
