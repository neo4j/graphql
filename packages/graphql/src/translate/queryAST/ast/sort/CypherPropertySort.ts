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
import type { AttributeAdapter } from "../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { CypherScalarOperation } from "../operations/CypherScalarOperation";
import type { SortField } from "./Sort";
import { Sort } from "./Sort";

export class CypherPropertySort extends Sort {
    private attribute: AttributeAdapter;
    private direction: Cypher.Order;
    private cypherOperation: CypherScalarOperation;
    private sortVariable: Cypher.Variable;
    constructor({
        attribute,
        direction,
        cypherOperation,
    }: {
        attribute: AttributeAdapter;
        direction: Cypher.Order;
        cypherOperation: CypherScalarOperation;
    }) {
        super();
        this.attribute = attribute;
        this.direction = direction;
        this.cypherOperation = cypherOperation;
        this.sortVariable = new Cypher.Variable();
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    public print(): string {
        return `${super.print()} <${this.attribute.name}>`;
    }

    public getFieldName(): string {
        return this.attribute.name;
    }

    public getSortFields(
        context: QueryASTContext,
        _variable: Cypher.Variable | Cypher.Property,
        _sortByDatabaseName = true
    ): SortField[] {
        const scope = context.getTargetScope();
        if (scope.has(this.attribute.name)) {
            const projectionVar = context.getScopeVariable(this.attribute.name);
            return [[projectionVar, this.direction]];
        }
        const projectionVar = this.sortVariable;
        return [[projectionVar, this.direction]];
    }

    public getProjectionField(context: QueryASTContext): string | Record<string, Cypher.Expr> {
        const scope = context.getTargetScope();
        if (scope.has(this.attribute.name)) {
            const projectionVar = context.getScopeVariable(this.attribute.name);
            return {
                [this.attribute.databaseName]: projectionVar,
            };
        }
        const projectionVar = this.sortVariable;

        return {
            [this.attribute.databaseName]: projectionVar,
        };
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        const scope = context.getTargetScope();
        if (scope.has(this.attribute.name)) {
            return [];
        }
        const sortContext = context.setReturn(this.sortVariable);
        const { clauses: subqueries } = this.cypherOperation.transpile(sortContext);

        return subqueries;
    }
}
