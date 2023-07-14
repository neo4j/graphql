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
import type { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import { Relationship } from "../../../schema-model/relationship/Relationship";

export abstract class QueryASTNode {}

export type SortField = [Cypher.Expr, Cypher.Order] | [Cypher.Expr];

type VarMap = {
    parentNode?: Cypher.Node;
    targetNode: Cypher.Node;
    edge?: Cypher.Relationship;
};

export class QueryASTContext {
    public readonly varMap: VarMap;
    public readonly parent?: QueryASTContext;
    public readonly target?: Cypher.Variable | Cypher.Property;

    constructor(varMap: VarMap, target?: Cypher.Variable | Cypher.Property, parent?: QueryASTContext) {
        this.varMap = varMap;
        this.parent = parent;
        this.target = target;
    }

    public push(target: Relationship | Cypher.Variable | Cypher.Property | VarMap): QueryASTContext {
        // Traverse the graph
        if (target instanceof Relationship) {
            return new QueryASTContext(
                {
                    parentNode: this.varMap.targetNode,
                    targetNode: new Cypher.Node({ labels: (target.target as ConcreteEntity).labels }),
                    edge: new Cypher.Relationship({ type: target.type }),
                },
                undefined,
                this
            );
        } else if (target instanceof Cypher.Variable || target instanceof Cypher.Property) {
            return new QueryASTContext(this.varMap, target, this); // Defines a target
        }
        return new QueryASTContext(target, undefined, this);
    }
}

export function createContext(rootEntity: ConcreteEntity): QueryASTContext {
    const node = new Cypher.Node({ labels: rootEntity.labels });
    return new QueryASTContext({
        targetNode: node,
    });
}

export type QueryASTResult = {
    subqueries?: Cypher.Clause[];
    sortFields?: SortField[];
};
