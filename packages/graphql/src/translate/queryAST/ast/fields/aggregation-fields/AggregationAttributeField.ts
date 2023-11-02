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
import type { AttributeAdapter } from "../../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { QueryASTNode } from "../../QueryASTNode";
import { AggregationField } from "./AggregationField";

export class AggregationAttributeField extends AggregationField {
    private attribute: AttributeAdapter;

    constructor({ alias, attribute }: { alias: string; attribute: AttributeAdapter }) {
        super(alias);
        this.attribute = attribute;
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    public getProjectionField(variable: Cypher.Variable): Record<string, Cypher.Expr> {
        return { [this.alias]: variable };
    }

    private getAggregationExpr(variable: Cypher.Variable | Cypher.Property): Cypher.Expr {
        if (this.attribute.typeHelper.isString()) {
            return new Cypher.Map({
                longest: Cypher.head(variable),
                shortest: Cypher.last(variable),
            });
        }
        if (this.attribute.typeHelper.isInt() || this.attribute.typeHelper.isFloat()) {
            return new Cypher.Map({
                min: Cypher.min(variable),
                max: Cypher.max(variable),
                average: Cypher.avg(variable),
                sum: Cypher.sum(variable),
            });
        }

        if (this.attribute.typeHelper.isDateTime()) {
            return new Cypher.Map({
                min: this.createDatetimeProjection(Cypher.min(variable)),
                max: this.createDatetimeProjection(Cypher.max(variable)),
            });
        }
        throw new Error(`Invalid aggregation type ${this.attribute.type.name}`);
    }

    public getAggregationProjection(target: Cypher.Variable, returnVar: Cypher.Variable): Cypher.Clause {
        if (this.attribute.typeHelper.isString()) {
            const aggrProp = target.property(this.attribute.databaseName);
            const listVar = new Cypher.NamedVariable("list");
            return new Cypher.With(target)
                .orderBy([Cypher.size(aggrProp), "DESC"])
                .with([Cypher.collect(aggrProp), listVar])
                .return([this.getAggregationExpr(listVar), returnVar]);
        }

        const aggrProp = target.property(this.attribute.databaseName);
        return new Cypher.Return([this.getAggregationExpr(aggrProp), returnVar]);
    }

    private createDatetimeProjection(expr: Cypher.Expr) {
        return Cypher.apoc.date.convertFormat(expr, "iso_zoned_date_time", "iso_offset_date_time");
    }
}
