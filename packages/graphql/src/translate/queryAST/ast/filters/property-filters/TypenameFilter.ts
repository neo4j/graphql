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
import { hasTarget } from "../../../utils/context-has-target";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import { Filter } from "../Filter";

export class TypenameFilter extends Filter {
    private readonly acceptedEntities: ConcreteEntityAdapter[];

    constructor(acceptedEntities: ConcreteEntityAdapter[]) {
        super();
        this.acceptedEntities = acceptedEntities;
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    public print(): string {
        const acceptedEntities = this.acceptedEntities.map((e) => e.name);
        return `${super.print()} [${acceptedEntities.join(", ")}]`;
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        if (!hasTarget(queryASTContext)) throw new Error("No parent node found!");
        const labelPredicate = this.acceptedEntities.map((e) => {
            return queryASTContext.target.hasLabels(e.name);
        });
        return Cypher.or(...labelPredicate);
    }
}
