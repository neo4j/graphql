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
import type { QueryASTContext } from "../../translate/queryAST/ast/QueryASTContext";
import type { QueryASTNode } from "../../translate/queryAST/ast/QueryASTNode";
import type { InputField } from "../../translate/queryAST/ast/input-fields/InputField";
import type { OperationTranspileResult } from "../../translate/queryAST/ast/operations/operations";
import { MutationOperation } from "../../translate/queryAST/ast/operations/operations";
import { getEntityLabels } from "../../translate/queryAST/utils/create-node-from-entity";
import type { V6ReadOperation } from "./ConnectionReadOperation";

export class V6CreateOperation extends MutationOperation {
    public readonly inputFields: Map<string, InputField>;
    public readonly target: ConcreteEntityAdapter;
    public readonly projectionOperations: V6ReadOperation[] = [];
    private readonly argumentToUnwind: Cypher.Param | Cypher.Property;
    private readonly unwindVariable: Cypher.Variable;

    constructor({
        target,
        argumentToUnwind,
    }: {
        target: ConcreteEntityAdapter;
        argumentToUnwind: Cypher.Param | Cypher.Property;
    }) {
        super();
        this.target = target;
        this.inputFields = new Map();
        this.argumentToUnwind = argumentToUnwind;
        this.unwindVariable = new Cypher.Variable();
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
        if (!context.hasTarget()) {
            throw new Error("No parent node found!");
        }

        const unwindClause = new Cypher.Unwind([this.argumentToUnwind, this.unwindVariable]);

        const createClause = new Cypher.Create(
            new Cypher.Pattern(context.target, { labels: getEntityLabels(this.target, context.neo4jGraphQLContext) })
        );
        const setSubqueries: Cypher.Clause[] = [];
        for (const field of this.inputFields.values()) {
            if (field.attachedTo === "node") {
                createClause.set(...field.getSetParams(context, this.unwindVariable));
                setSubqueries.push(...field.getSubqueries(context));
            }
        }

        const nestedSubqueries = setSubqueries.flatMap((clause) => [
            new Cypher.With(context.target, this.unwindVariable),
            new Cypher.Call(clause).importWith(context.target, this.unwindVariable),
        ]);

        const unwindCreateClauses = Cypher.concat(createClause, ...nestedSubqueries);

        const subQueryClause: Cypher.Clause = new Cypher.Call(
            Cypher.concat(unwindCreateClauses, new Cypher.Return(context.target))
        ).importWith(this.unwindVariable);

        const projectionContext = context.setReturn(new Cypher.NamedVariable("data"));
        const clauses = Cypher.concat(unwindClause, subQueryClause, ...this.getProjectionClause(projectionContext));
        return { projectionExpr: context.returnVariable, clauses: [clauses] };
    }

    private getProjectionClause(context: QueryASTContext): Cypher.Clause[] {
        return this.projectionOperations.map((operationField) => {
            return Cypher.concat(...operationField.transpile(context).clauses);
        });
    }
}
