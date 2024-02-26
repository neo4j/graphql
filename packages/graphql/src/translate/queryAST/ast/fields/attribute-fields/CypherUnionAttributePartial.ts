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
import type { ConcreteEntityAdapter } from "../../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { QueryASTContext } from "../../QueryASTContext";
import { QueryASTNode } from "../../QueryASTNode";
import type { Field } from "../Field";

export class CypherUnionAttributePartial extends QueryASTNode {
    protected fields: Field[];
    protected target: ConcreteEntityAdapter;

    constructor({ fields, target }: { fields: Field[]; target: ConcreteEntityAdapter }) {
        super();
        this.fields = fields;
        this.target = target;
    }

    public getChildren(): QueryASTNode[] {
        return this.fields;
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        return this.fields.flatMap((f) => f.getSubqueries(context));
    }

    public getProjectionExpression(variable: Cypher.Variable): Cypher.Expr {
        const projection = new Cypher.MapProjection(variable);
        this.setSubqueriesProjection(projection, this.fields, variable);
        projection.set({
            __resolveType: new Cypher.Literal(this.target.name),
        });
        return projection;
    }

    public getFilterPredicate(variable: Cypher.Variable): Cypher.Predicate {
        const labels = this.target.getLabels();

        // TODO: Refactor when `.hasLabel` on variables is supported in CypherBuilder
        const predicates = labels.map((label) => {
            return new Cypher.Raw((env) => {
                const varName = env.compile(variable);
                const labelStr = Cypher.utils.escapeLabel(label);
                return `${varName}:${labelStr}`;
            });
        });
        return Cypher.and(...predicates);
    }

    private setSubqueriesProjection(projection: Cypher.MapProjection, fields: Field[], fromVariable: Cypher.Variable) {
        const subqueriesProjection = fields?.map((f) => f.getProjectionField(fromVariable));
        for (const subqueryProjection of subqueriesProjection) {
            projection.set(subqueryProjection);
        }
    }

    public isCypherField(): boolean {
        return true;
    }
}
