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
import type { Entity } from "../../../../../schema-model/entity/Entity";
import type { QueryASTNode } from "../../QueryASTNode";
import { AggregationField } from "./AggregationField";

export class CountField extends AggregationField {
    private entity: Entity;

    constructor({ alias, entity }: { alias: string; entity: Entity }) {
        super(alias);
        this.entity = entity;
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    public getProjectionField(variable: Cypher.Variable): Record<string, Cypher.Expr> {
        return { [this.alias]: variable };
    }

    public getAggregationExpr(variable: Cypher.Variable): Cypher.Expr {
        return Cypher.count(variable);
    }

    public getAggregationProjection(target: Cypher.Variable, returnVar: Cypher.Variable): Cypher.Clause {
        return new Cypher.Return([this.getAggregationExpr(target), returnVar]);
    }
}
