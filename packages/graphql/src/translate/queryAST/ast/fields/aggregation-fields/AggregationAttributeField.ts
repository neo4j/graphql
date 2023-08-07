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
import { AggregationField } from "./AggregationField";
import type { Attribute } from "../../../../../schema-model/attribute/Attribute";
import { AttributeAdapter } from "../../../../../schema-model/attribute/model-adapters/AttributeAdapter";

export class AggregationAttributeField extends AggregationField {
    private attribute: AttributeAdapter;

    constructor({ alias, attribute }: { alias: string; attribute: AttributeAdapter }) {
        super(alias);
        this.attribute = attribute;
    }

    public getProjectionField(variable: Cypher.Variable): Record<string, Cypher.Expr> {
        return { [this.alias]: variable };
    }

    public getAggregationExpr(variable: Cypher.Variable): Cypher.Expr {
        return Cypher.count(variable);
    }

    public getAggregationProjection(target: Cypher.Variable, returnVar: Cypher.Variable): Cypher.Clause {
        if (this.attribute.isString()) {
            const aggrProp = target.property(this.attribute.name);
            const listVar = new Cypher.NamedVariable("list");
            return new Cypher.With(target)
                .orderBy([Cypher.size(aggrProp), "DESC"])
                .with([Cypher.collect(aggrProp), listVar])
                .return([
                    new Cypher.Map({
                        longest: Cypher.head(listVar),
                        shortest: Cypher.last(listVar),
                    }),
                    returnVar,
                ]);
        }
        if (this.attribute.isInt() || this.attribute.isFloat()) {
            const aggrProp = target.property(this.attribute.name);
            return new Cypher.Return([
                new Cypher.Map({
                    min: Cypher.min(aggrProp),
                    max: Cypher.max(aggrProp),
                    average: Cypher.avg(aggrProp),
                    sum: Cypher.sum(aggrProp),
                }),
                returnVar,
            ]);
        }

        if (this.attribute.isDateTime()) {
            const aggrProp = target.property(this.attribute.name);
            return new Cypher.Return([
                new Cypher.Map({
                    min: this.createDatetimeProjection(Cypher.min(aggrProp)),
                    max: this.createDatetimeProjection(Cypher.max(aggrProp)),
                }),
                returnVar,
            ]);
        }
        // TODO: Remove this casting and add a proper getName method to AttributeType
        throw new Error(`Invalid aggregation type ${(this.attribute.type as { name: string }).name}`);
    }

    private createDatetimeProjection(expr: Cypher.Expr) {
        return Cypher.apoc.date.convertFormat(
            expr as any, // TODO: any due to a problem in CB types
            "iso_zoned_date_time",
            "iso_offset_date_time"
        );
    }
}
