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
import { createRelationshipValidationStringUsingSchemaModel } from "../../../create-relationship-validation-string";
import { createNodeFromEntity, createRelationshipFromEntity } from "../../utils/create-node-from-entity";
import { assertIsConcreteEntity } from "../../utils/is-concrete-entity";
import { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { AuthorizationFilters } from "../filters/authorization-filters/AuthorizationFilters";
import type { InputField } from "../input-fields/InputField";
import { ReferenceInputField } from "../input-fields/ReferenceInputField";
import type { ReadOperation } from "./ReadOperation";
import { MutationOperation, type OperationTranspileResult } from "./operations";

export class UnwindCreateOperation extends MutationOperation {
    public inputFields: Map<string, InputField>;
    private argumentToUnwind: Cypher.Param | Cypher.Property;
    private unwindVariable: Cypher.Variable;

    public readonly target: ConcreteEntityAdapter | RelationshipAdapter;
    // The response fields in the mutation, currently only READ operations are supported in the MutationResponse
    public projectionOperations: ReadOperation[] = [];

    protected authFilters: AuthorizationFilters[] = [];

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
    }

    public addAuthFilters(...filter: AuthorizationFilters[]) {
        this.authFilters.push(...filter);
    }

    public addField(field: InputField) {
        if (!this.inputFields.has(field.name)) {
            this.inputFields.set(field.name, field);
        }
    }

    public getField(key: string): InputField | undefined {
        return this.inputFields.get(key);
    }

    public getUnwindArgument(): Cypher.Param | Cypher.Property {
        return this.argumentToUnwind;
    }

    public getUnwindVariable(): Cypher.Variable {
        return this.unwindVariable;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy(this.projectionOperations);
    }

    public addProjectionOperations(operations: ReadOperation[]) {
        this.projectionOperations.push(...operations);
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        context.env.topLevelOperationName = "CREATE";
        if (!context.hasTarget()) {
            throw new Error("TODO PROPER ERROR MESSAGE");
        }

        if (this.target instanceof RelationshipAdapter) {
            const nestedTarget = this.target.target;
            assertIsConcreteEntity(nestedTarget);
            const nestedTargetNode = createNodeFromEntity(nestedTarget, context.neo4jGraphQLContext);
            const relationship = createRelationshipFromEntity(this.target);

            const nestedContext = context.push({
                target: nestedTargetNode,
                relationship,
            });
            return this.transpileNested(nestedContext);
        }
        const entity = this.target.entity;
        checkEntityAuthentication({
            context: context.neo4jGraphQLContext,
            entity,
            targetOperations: ["CREATE"],
        });
        this.inputFields.forEach((field) => {
            if (field instanceof ReferenceInputField)
                checkEntityAuthentication({
                    context: context.neo4jGraphQLContext,
                    entity,
                    targetOperations: ["CREATE"],
                    field: field.name,
                });
        });
        const unwindClause = new Cypher.Unwind([this.argumentToUnwind, this.unwindVariable]);

        const createClause = new Cypher.Create(context.target);
        const setSubqueries: Cypher.Clause[] = [];
        const nodeInputFields = [...this.inputFields.values()].filter((field) => field.attachedTo === "node");
        for (const field of nodeInputFields) {
            createClause.set(...field.getSetFields(context));
            setSubqueries.push(...field.getSetClause(context));
        }

        const autogeneratedFields = this.getAutoGeneratedFields(context.target, this.target);

        createClause.set(...autogeneratedFields);
        const nestedSubqueries = setSubqueries.flatMap((clause) => [
            new Cypher.With(context.target, this.unwindVariable),
            new Cypher.Call(clause).importWith(context.target, this.unwindVariable),
        ]);

        const authorizationClauses = this.getAuthorizationClauses(context);
        const relationshipValidationClause = new Cypher.Raw((env: Cypher.Environment) => {
            const validationStr = createRelationshipValidationStringUsingSchemaModel({
                entity: this.target as ConcreteEntityAdapter,
                context: context.neo4jGraphQLContext,
                varName: env.getReferenceId(context.target),
            });
            const cypher: string[] = [];

            if (validationStr) {
                cypher.push(`WITH ${env.getReferenceId(context.target)}`);
                cypher.push(validationStr);
            }
            return cypher.join("\n");
        });
        const subQueryClause = Cypher.concat(
            ...filterTruthy([
                createClause,
                ...nestedSubqueries,
                ...authorizationClauses,
                relationshipValidationClause,
                new Cypher.Return(context.target),
            ])
        );

        const createSubquery = new Cypher.Call(subQueryClause).importWith(this.unwindVariable);

        const nestedContext = new QueryASTContext({
            ...context,
            target: context.target,
            returnVariable: new Cypher.NamedVariable("data"),
            shouldCollect: true,
        });

        const clauses = Cypher.concat(unwindClause, createSubquery, ...this.getProjectionClause(nestedContext));
        return { projectionExpr: context.returnVariable, clauses: [clauses] };
    }

    public transpileNested(context: QueryASTContext<Cypher.Node>): OperationTranspileResult {
        if (!context.source) {
            throw new Error("TODO PROPER ERROR MESSAGE");
        }
        if (!(this.target instanceof RelationshipAdapter)) {
            throw new Error("TODO PROPER ERROR MESSAGE");
        }
        const nodeTarget = this.target.target;
        assertIsConcreteEntity(nodeTarget);
        checkEntityAuthentication({
            context: context.neo4jGraphQLContext,
            entity: nodeTarget.entity,
            targetOperations: ["CREATE"],
        });
        this.inputFields.forEach((field) => {
            if (field instanceof ReferenceInputField)
                checkEntityAuthentication({
                    context: context.neo4jGraphQLContext,
                    entity: nodeTarget.entity,
                    targetOperations: ["CREATE"],
                    field: field.name,
                });
        });
        const unwindClause = new Cypher.Unwind([this.argumentToUnwind, this.unwindVariable]);

        const createClause = new Cypher.Create(context.target);
        const setSubqueries: Cypher.Clause[] = [];
        const nodeInputFields = [...this.inputFields.values()].filter((field) => field.attachedTo === "node");
        for (const field of nodeInputFields) {
            createClause.set(...field.getSetFields(context));
            setSubqueries.push(...field.getSetClause(context));
        }
        const mergeClause = new Cypher.Merge(
            new Cypher.Pattern(context.source)
                .withoutLabels()
                .related(context.relationship)
                .withDirection(this.target.cypherDirectionFromRelDirection())
                .to(context.target)
                .withoutLabels()
        );
        const edgeInputFields = [...this.inputFields.values()].filter((field) => field.attachedTo === "relationship");
        for (const field of edgeInputFields) {
            mergeClause.set(...field.getSetFields(context));
        }

        if (!context.relationship) {
            throw new Error("bla");
        }
        const autogeneratedNodeFields = this.getAutoGeneratedFields(context.target, nodeTarget);
        const autogeneratedRelationshipFields = this.getAutoGeneratedFields(context.relationship, this.target);

        createClause.set(...autogeneratedNodeFields);
        mergeClause.set(...autogeneratedRelationshipFields);

        const nestedSubqueries = setSubqueries.flatMap((clause) => [
            new Cypher.With(context.target, this.unwindVariable),
            new Cypher.Call(clause).importWith(context.target, this.unwindVariable),
        ]);

        const projectionExpr = new Cypher.Variable();
        const relationshipValidationClause = new Cypher.Raw((env: Cypher.Environment) => {
            const validationStr = createRelationshipValidationStringUsingSchemaModel({
                entity: nodeTarget,
                context: context.neo4jGraphQLContext,
                varName: env.getReferenceId(context.target),
            });
            const cypher: string[] = [];

            if (validationStr) {
                cypher.push(`WITH ${env.getReferenceId(context.target)}`);
                cypher.push(validationStr);
            }
            return cypher.join("\n");
        });

        const authorizationClauses = this.getAuthorizationClauses(context);
        const nestedClause = Cypher.concat(
            ...filterTruthy([
                createClause,
                mergeClause,
                ...nestedSubqueries,
                ...authorizationClauses,
                relationshipValidationClause,
                new Cypher.Return([Cypher.collect(Cypher.Null), projectionExpr]),
            ])
        );

        const nestedContext = new QueryASTContext({
            ...context,
            target: context.target,
            returnVariable: new Cypher.NamedVariable("data"),
            shouldCollect: true,
        });
        const clauses = Cypher.concat(unwindClause, nestedClause, ...this.getProjectionClause(nestedContext));
        return { projectionExpr, clauses: [clauses] };
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

    private isNested(): this is this & { target: RelationshipAdapter } {
        return this.target instanceof RelationshipAdapter;
    }

    private getProjectionClause(context: QueryASTContext): Cypher.Clause[] {
        if (this.projectionOperations.length === 0 && !this.isNested()) {
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
