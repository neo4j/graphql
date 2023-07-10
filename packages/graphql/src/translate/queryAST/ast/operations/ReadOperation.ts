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

import type { ConcreteEntity } from "../../../../schema-model/entity/ConcreteEntity";
import { filterTruthy } from "../../../../utils/utils";
import { createNodeFromEntity } from "../../utils/create-node-from-entity";
import type { Field } from "../fields/Field";
import type { Filter } from "../filters/Filter";
import Cypher from "@neo4j/cypher-builder";
import type { OperationTranspileOptions } from "./operations";
import { Operation } from "./operations";

export class ReadOperation extends Operation {
    public readonly entity: ConcreteEntity; // TODO: normal entities

    public fields: Field[] = [];
    private filters: Filter[] = [];

    public nodeAlias: string | undefined; // This is just to maintain naming with the old way (this), remove after refactor

    constructor(entity: ConcreteEntity) {
        super();
        this.entity = entity;
    }

    public setFields(fields: Field[]) {
        this.fields = fields;
    }

    public setFilters(filters: Filter[]) {
        this.filters = filters;
    }

    public transpile({ returnVariable, parentNode }: OperationTranspileOptions): Cypher.Clause {
        const node = createNodeFromEntity(this.entity, this.nodeAlias);

        const filterPredicates = Cypher.and(...this.filters.map((f) => f.getPredicate(node)));
        const projectionFields = this.fields.map((f) => f.getProjectionField());

        const projection = this.getProjectionMap(node, projectionFields);

        const matchClause = new Cypher.Match(node);
        if (filterPredicates) {
            matchClause.where(filterPredicates);
        }
        const subqueries = Cypher.concat(...this.getFieldsSubqueries(node));
        const ret = new Cypher.Return([projection, returnVariable]);

        return Cypher.concat(matchClause, subqueries, ret);
    }

    private getFieldsSubqueries(node: Cypher.Node): Cypher.Clause[] {
        return filterTruthy(
            this.fields.map((f) => {
                return f.getSubquery(node);
            })
        ).map((sq) => {
            return new Cypher.Call(sq).innerWith(node);
        });
    }

    private getProjectionMap(
        node: Cypher.Node,
        projectionFields: Array<string | Record<string, Cypher.Expr>>
    ): Cypher.MapProjection {
        const stringFields: string[] = [];
        let otherFields: Record<string, Cypher.Expr> = {};

        for (const field of projectionFields) {
            if (typeof field === "string") stringFields.push(field);
            else {
                otherFields = { ...otherFields, ...field };
            }
        }

        return new Cypher.MapProjection(node, stringFields, otherFields);
    }
}
