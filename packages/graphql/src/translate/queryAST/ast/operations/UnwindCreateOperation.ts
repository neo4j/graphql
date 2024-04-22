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
import type { CypherFunction } from "@neo4j/cypher-builder/dist/expressions/functions/CypherFunctions";
import { Neo4jGraphQLTemporalType } from "../../../../schema-model/attribute/AttributeType";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { filterTruthy } from "../../../../utils/utils";
import { checkEntityAuthentication } from "../../../authorization/check-authentication";
import { createRelationshipValidationClauses } from "../../../create-relationship-validation-clauses";
import { createNodeFromEntity, createRelationshipFromEntity } from "../../utils/create-node-from-entity";
import { assertIsConcreteEntity } from "../../utils/is-concrete-entity";
import { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { AuthorizationFilters } from "../filters/authorization-filters/AuthorizationFilters";
import type { InputField } from "../input-fields/InputField";
import { ReferenceInputField } from "../input-fields/ReferenceInputField";
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
        argumentToUnwind: argumentToUnwind,
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
        return filterTruthy(this.projectionOperations);
    }

    public addAuthFilters(...filter: AuthorizationFilters[]) {
        this.authFilters.push(...filter);
    }

    public getField(key: string): any {
        return this.inputFields.get(key);
    }

    public addField(field: InputField) {
        if (!this.inputFields.has(field.name)) {
            this.inputFields.set(field.name, field);
        }
    }

    public getUnwindArgument(): Cypher.Param | Cypher.Property {
        return this.argumentToUnwind;
    }

    public getUnwindVariable(): Cypher.Variable {
        return this.unwindVariable;
    }

    public addProjectionOperations(operations: ReadOperation[]) {
        this.projectionOperations.push(...operations);
    }

    public getTarget(): ConcreteEntityAdapter {
        if (this.target instanceof RelationshipAdapter) {
            const targetAdapter = this.target.target;
            assertIsConcreteEntity(targetAdapter);
            return targetAdapter;
        }
        return this.target;
    }

    public getNestedContext(context: QueryASTContext): QueryASTContext {
        if (this.target instanceof RelationshipAdapter) {
            const nestedTarget = this.target.target;
            assertIsConcreteEntity(nestedTarget);
            const nestedTargetNode = createNodeFromEntity(nestedTarget, context.neo4jGraphQLContext);
            const relationship = createRelationshipFromEntity(this.target);

            return context.push({
                target: nestedTargetNode,
                relationship,
            });
        }
        return context;
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
            if (field instanceof ReferenceInputField)
                checkEntityAuthentication({
                    context: nestedContext.neo4jGraphQLContext,
                    entity: target.entity,
                    targetOperations: ["CREATE"],
                    field: field.name,
                });
        });
        const unwindClause = new Cypher.Unwind([this.argumentToUnwind, this.unwindVariable]);

        const createClause = new Cypher.Create(nestedContext.target);
        const setSubqueries: Cypher.Clause[] = [];
        let mergeClause: Cypher.Merge | undefined;
        if (this.isNested) {
            if (!nestedContext.source || !nestedContext.relationship) {
                throw new Error("Transpile error: No source or relationship found!");
            }
            if (!(this.target instanceof RelationshipAdapter)) {
                throw new Error("Transpile error: Invalid target");
            }

            mergeClause = new Cypher.Merge(
                new Cypher.Pattern(nestedContext.source)
                    .withoutLabels()
                    .related(nestedContext.relationship)
                    .withDirection(this.target.cypherDirectionFromRelDirection())
                    .to(nestedContext.target)
                    .withoutLabels()
            );
            const autogeneratedRelationshipFields = this.getAutoGeneratedFields(
                nestedContext.relationship,
                this.target
            );

            mergeClause.set(...autogeneratedRelationshipFields);
        }

        const autogeneratedFields = this.getAutoGeneratedFields(nestedContext.target, target);

        createClause.set(...autogeneratedFields);
        for (const field of this.inputFields.values()) {
            if (field.attachedTo === "relationship" && mergeClause) {
                mergeClause.set(...field.getSetFields(nestedContext));
            } else if (field.attachedTo === "node") {
                createClause.set(...field.getSetFields(nestedContext));
                setSubqueries.push(...field.getSetClause(nestedContext));
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

    private getAutoGeneratedFields(
        cypherNodeRef: Cypher.Node | Cypher.Relationship,
        entityOrRel: ConcreteEntityAdapter | RelationshipAdapter
    ): Cypher.SetParam[] {
        const setParams: Cypher.SetParam[] = [];
        entityOrRel.attributes.forEach((attribute) => {
            if (attribute.timestampCreateIsGenerated()) {
                // DateTime -> datetime(); Time -> time()
                const relatedCypherExpression = this.getCypherTemporalFunction(
                    attribute.type.name as Neo4jGraphQLTemporalType
                );
                if (attribute.databaseName) {
                    setParams.push([cypherNodeRef.property(attribute.databaseName), relatedCypherExpression]);
                }
            }
            if (attribute.annotations.id) {
                setParams.push([cypherNodeRef.property(attribute.databaseName), Cypher.randomUUID()]);
            }
        });

        return setParams;
    }

    private getCypherTemporalFunction(type: Neo4jGraphQLTemporalType): CypherFunction {
        switch (type) {
            case Neo4jGraphQLTemporalType.DateTime:
                return Cypher.datetime();

            case Neo4jGraphQLTemporalType.LocalDateTime:
                return Cypher.localdatetime();

            case Neo4jGraphQLTemporalType.Time:
                return Cypher.time();

            case Neo4jGraphQLTemporalType.LocalTime:
                return Cypher.localtime();

            default: {
                throw new Error(`Transpile error: Expected type to one of:
                [ 
                    ${Neo4jGraphQLTemporalType.DateTime},
                    ${Neo4jGraphQLTemporalType.LocalDateTime}, 
                    ${Neo4jGraphQLTemporalType.Time},
                    ${Neo4jGraphQLTemporalType.LocalTime}
                ]
                but found ${type} instead`);
            }
        }
    }
}
