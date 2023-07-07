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

import type { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import type { Relationship } from "../../../schema-model/relationship/Relationship";
import { filterTruthy } from "../../../utils/utils";
import { createNodeFromEntity } from "../utils/create-node-from-entity";
import { getRelationshipDirection } from "../utils/get-relationship-direction";
import type { Field } from "./fields/Field";
import type { Filter } from "./filters/Filter";
import { QueryASTNode } from "./QueryASTNode";
import Cypher from "@neo4j/cypher-builder";

export type Operation = ReadOperation | ConnectionReadOperation;

export class ReadOperation extends QueryASTNode {
    public readonly entity: ConcreteEntity; // TODO: normal entities

    public fields: Field[] = [];
    private filters: Filter[] = [];

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

    public transpile(returnValue: Cypher.Variable, parentNode?: Cypher.Node, alias?: string): Cypher.Clause {
        const node = createNodeFromEntity(this.entity, alias);
        const clause = new Cypher.Match(node);

        const filterPredicates = Cypher.and(...this.filters.map((f) => f.getPredicate(node)));

        const projectionFields = this.fields.map((f) => f.getProjectionField());
        const fieldSubqueries = filterTruthy(
            this.fields.map((f) => {
                return f.getSubquery(node);
            })
        ).map((sq) => {
            return new Cypher.Call(sq).innerWith(node);
        });

        const stringFields: string[] = [];
        let otherFields: Record<string, Cypher.Expr> = {};
        for (const field of projectionFields) {
            if (typeof field === "string") stringFields.push(field);
            else {
                otherFields = { ...otherFields, ...field };
            }
        }

        const projection = new Cypher.MapProjection(node, stringFields, otherFields);

        const subqueries = Cypher.concat(...fieldSubqueries);

        const clauseWhere = clause.where(filterPredicates);

        const ret = new Cypher.Return([projection, returnValue]);

        return Cypher.concat(clauseWhere, subqueries, ret);
    }
}

export class ConnectionReadOperation extends QueryASTNode {
    public readonly relationship: Relationship;

    public nodeFields: Field[] = [];
    public edgeFields: Field[] = [];

    private nodeFilters: Filter[] = [];

    constructor(relationship: Relationship) {
        super();
        this.relationship = relationship;
    }

    public setNodeFields(fields: Field[]) {
        this.nodeFields = fields;
    }
    public setNodeFilters(filters: Filter[]) {
        this.nodeFilters = filters;
    }

    public setEdgeFields(fields: Field[]) {
        this.edgeFields = fields;
    }

    public transpile(returnValue: Cypher.Variable, parentNode: Cypher.Node): Cypher.Clause {
        const node = createNodeFromEntity(this.relationship.target as ConcreteEntity);
        const relationship = new Cypher.Relationship({ type: this.relationship.type });
        const relDirection = getRelationshipDirection(this.relationship);
        const clause = new Cypher.Match(
            new Cypher.Pattern(parentNode).withoutLabels().related(relationship).withDirection(relDirection).to(node)
        );

        const filterPredicates = Cypher.and(...this.nodeFilters.map((f) => f.getPredicate(node)));

        const nodeProjectionMap = new Cypher.Map();
        this.nodeFields
            .map((f) => f.getProjectionField())
            .forEach((p) => {
                if (typeof p === "string") {
                    nodeProjectionMap.set(p, node.property(p));
                } else {
                    // TODO
                }
            });

        const edgeVar = new Cypher.NamedVariable("edge");
        const edgesVar = new Cypher.NamedVariable("edges");
        const totalCount = new Cypher.NamedVariable("totalCount");

        const edgeProjectionMap = new Cypher.Map();

        this.edgeFields
            .map((f) => f.getProjectionField())
            .forEach((p) => {
                if (typeof p === "string") {
                    edgeProjectionMap.set(p, relationship.property(p));
                } else {
                    // TODO
                }
            });

        edgeProjectionMap.set("node", nodeProjectionMap);

        return clause
            .where(filterPredicates)
            .with([edgeProjectionMap, edgeVar])
            .with([Cypher.collect(edgeVar), edgesVar])
            .with(edgesVar, [Cypher.size(edgesVar), totalCount])
            .return([
                new Cypher.Map({
                    edges: edgesVar,
                    totalCount: totalCount,
                }),
                returnValue,
            ]);
    }
}
