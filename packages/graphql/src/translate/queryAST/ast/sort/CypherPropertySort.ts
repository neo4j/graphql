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
import type { CypherAttributeOperation } from "../operations/CypherAttributeOperation";
import type { SortField } from "./Sort";
import { Sort } from "./Sort";

export class CypherPropertySort extends Sort {
    private attribute: AttributeAdapter;
    private direction: Cypher.Order;
    private cypherOperation: CypherAttributeOperation;

    constructor({
        attribute,
        direction,
        cypherOperation,
    }: {
        attribute: AttributeAdapter;
        direction: Cypher.Order;
        cypherOperation: CypherAttributeOperation;
    }) {
        super();
        this.attribute = attribute;
        this.direction = direction;
        this.cypherOperation = cypherOperation;
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
        // sort variable could be defined by the the CypherPropertySort as well as by the CypherScalarOperation
        const projectionVar = context.getScopeVariable(this.attribute.name);
        return [[projectionVar, this.direction]];
    }

    public getProjectionField(context: QueryASTContext): string | Record<string, Cypher.Expr> {
        // sort variable could be defined by the the CypherPropertySort as well as by the CypherScalarOperation
        const projectionVar = context.getScopeVariable(this.attribute.name);
        return {
            [this.attribute.databaseName]: projectionVar,
        };
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        const scope = context.getTargetScope();
        if (scope.has(this.attribute.name)) {
            return [];
        }
        const returnVariable = new Cypher.Variable();
        const sortContext = context.setReturn(returnVariable);
        const { clauses: subqueries } = this.cypherOperation.transpile(sortContext);

        return subqueries;
    }
}
