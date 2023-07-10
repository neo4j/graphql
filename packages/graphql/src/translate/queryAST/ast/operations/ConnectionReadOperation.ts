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
import type { Relationship } from "../../../../schema-model/relationship/Relationship";
import { createNodeFromEntity } from "../../utils/create-node-from-entity";
import { getRelationshipDirection } from "../../utils/get-relationship-direction";
import type { Field } from "../fields/Field";
import type { Filter } from "../filters/Filter";
import Cypher from "@neo4j/cypher-builder";
import type { OperationTranspileOptions } from "./operations";
import { Operation } from "./operations";

export class ConnectionReadOperation extends Operation {
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

    public transpile({ returnVariable, parentNode }: OperationTranspileOptions): Cypher.Clause {
        if (!parentNode) throw new Error();
        const node = createNodeFromEntity(this.relationship.target as ConcreteEntity);
        const relationship = new Cypher.Relationship({ type: `\`${this.relationship.type}\`` }); // TODO: remove custom escaping
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

        if (nodeProjectionMap.size === 0) {
            const targetNodeName = this.relationship.target.name;
            nodeProjectionMap.set({
                __resolveType: new Cypher.Literal(targetNodeName),
                __id: Cypher.id(node),
            });
        }

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
                returnVariable,
            ]);
    }
}
