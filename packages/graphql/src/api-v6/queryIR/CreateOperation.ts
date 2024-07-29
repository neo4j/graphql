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
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { createRelationshipValidationClauses } from "../../translate/create-relationship-validation-clauses";
import { QueryASTContext } from "../../translate/queryAST/ast/QueryASTContext";
import type { QueryASTNode } from "../../translate/queryAST/ast/QueryASTNode";
import type { InputField } from "../../translate/queryAST/ast/input-fields/InputField";
import type { OperationTranspileResult } from "../../translate/queryAST/ast/operations/operations";
import { MutationOperation } from "../../translate/queryAST/ast/operations/operations";
import { getEntityLabels } from "../../translate/queryAST/utils/create-node-from-entity";
import { assertIsConcreteEntity } from "../../translate/queryAST/utils/is-concrete-entity";
import type { V6ReadOperation } from "./ConnectionReadOperation";

export class V6CreateOperation extends MutationOperation {
    public readonly inputFields: Map<string, InputField>;
    public readonly target: ConcreteEntityAdapter | RelationshipAdapter;
    public readonly projectionOperations: V6ReadOperation[] = [];
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
        return [...this.inputFields.values(), ...this.projectionOperations];
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

    public addProjectionOperations(operations: V6ReadOperation[]) {
        this.projectionOperations.push(...operations);
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        const nestedContext = this.getNestedContext(context);
        nestedContext.env.topLevelOperationName = "CREATE";

        if (!nestedContext.hasTarget()) {
            throw new Error("No parent node found!");
        }
        const target = this.getTarget();

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
        const cardinalityClauses = createRelationshipValidationClauses({
            entity: target,
            context: nestedContext.neo4jGraphQLContext,
            varName: nestedContext.target,
        });
        const unwindCreateClauses = Cypher.concat(
            createClause,
            mergeClause,
            ...nestedSubqueries,
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

    private getNestedContext(context: QueryASTContext): QueryASTContext {
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
