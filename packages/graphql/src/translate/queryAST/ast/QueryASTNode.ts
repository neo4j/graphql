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

type RelationshipVars = {
    parentNode: Cypher.Node;
    targetNode: Cypher.Node;
    edge: Cypher.Relationship;
};

export class QueryASTContext<T extends Cypher.Variable | RelationshipVars = Cypher.Variable | RelationshipVars> {
    public readonly target: T;
    public readonly parent?: QueryASTContext;

    constructor(target: T, parent?: QueryASTContext) {
        this.target = target;
        this.parent = parent;
    }

    public push(target?: Cypher.Variable | Relationship): QueryASTContext {
        let newTarget: Cypher.Variable | RelationshipVars;
        if (!target) newTarget = new Cypher.Variable();
        else if (target instanceof Relationship) {
            newTarget = {
                parentNode: this.getParentNode(),
                targetNode: new Cypher.Node({ labels: (target.target as ConcreteEntity).labels }),
                edge: new Cypher.Relationship({ type: target.type }),
            };
        } else {
            newTarget = target;
        }

        return new QueryASTContext(newTarget, this);
    }

    private getParentNode(): Cypher.Node {
        if (this.target instanceof Cypher.Variable) return this.target as Cypher.Node;
        return this.target.targetNode;
    }
}

export function createContext(rootEntity: ConcreteEntity): QueryASTContext {
    const node = new Cypher.Node({ labels: rootEntity.labels });
    return new QueryASTContext(node);
}

export type QueryASTResult = {
    subqueries?: Cypher.Clause[];
    sortFields?: SortField[];
};
