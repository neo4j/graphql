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
import { filterFields, renameFields } from "../../../../../utils/utils";
import type { QueryASTNode } from "../../QueryASTNode";
import { AggregationField } from "./AggregationField";

export class AggregationAttributeField extends AggregationField {
    private attribute: AttributeAdapter;

    private aggregationProjection: Record<string, string>;
    private useReduce: boolean; //Use reduce instead of subqueries

    constructor({
        alias,
        attribute,
        aggregationProjection,
        useReduce,
    }: {
        alias: string;
        attribute: AttributeAdapter;
        aggregationProjection: Record<string, string>;
        useReduce: boolean;
    }) {
        super(alias);
        this.attribute = attribute;
        this.aggregationProjection = aggregationProjection;
        this.useReduce = useReduce;
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    public getProjectionField(variable: Cypher.Variable): Record<string, Cypher.Expr> {
        return { [this.alias]: variable };
    }

    public getAggregationExpr(target: Cypher.Variable): Cypher.Expr {
        const variable = target.property(this.attribute.databaseName);
        return this.createAggregationExpr(variable);
    }

    public getAggregationProjection(target: Cypher.Variable, returnVar: Cypher.Variable): Cypher.Clause {
        if (this.attribute.typeHelper.isString()) {
            const aggrProp = target.property(this.attribute.databaseName);
            const listVar = new Cypher.NamedVariable("list");
            return new Cypher.With(target)
                .orderBy([Cypher.size(aggrProp), "DESC"])
                .with([Cypher.collect(aggrProp), listVar])
                .return([this.createAggregationExpr(listVar), returnVar]);
        }

        return new Cypher.Return([this.getAggregationExpr(target), returnVar]);
    }

    private createAggregationExpr(variable: Cypher.Variable | Cypher.Property): Cypher.Expr {
        if (this.attribute.typeHelper.isString()) {
            if (this.useReduce) {
                const aggVar = new Cypher.NamedVariable("aggVar");
                const current = new Cypher.NamedVariable("current");
                const collectIndex1 = new Cypher.Raw((env) => {
                    const collect = Cypher.collect(variable);
                    const result = env.compile(collect);
                    return `${result}[0]`;
                });
                const collectIndex2 = new Cypher.Raw((env) => {
                    const collect = Cypher.collect(variable);
                    const result = env.compile(collect);
                    return `${result}[0]`;
                });

                return new Cypher.Map(
                    this.filterProjection({
                        shortest: Cypher.reduce(
                            aggVar,
                            collectIndex1,
                            current,
                            Cypher.collect(variable),
                            new Cypher.Case()
                                .when(Cypher.lt(Cypher.size(current), Cypher.size(aggVar)))
                                .then(current)
                                .else(aggVar)
                        ),
                        longest: Cypher.reduce(
                            aggVar,
                            collectIndex2,
                            current,
                            Cypher.collect(variable),
                            new Cypher.Case()
                                .when(Cypher.gt(Cypher.size(current), Cypher.size(aggVar)))
                                .then(current)
                                .else(aggVar)
                        ),
                    })
                );
            }

            return new Cypher.Map(
                this.filterProjection({
                    longest: Cypher.head(variable),
                    shortest: Cypher.last(variable),
                })
            );
        }
        if (
            this.attribute.typeHelper.isInt() ||
            this.attribute.typeHelper.isFloat() ||
            this.attribute.typeHelper.isBigInt()
        ) {
            return new Cypher.Map(
                this.filterProjection({
                    min: Cypher.min(variable),
                    max: Cypher.max(variable),
                    average: Cypher.avg(variable),
                    sum: Cypher.sum(variable),
                })
            );
        }

        if (this.attribute.typeHelper.isDateTime()) {
            return new Cypher.Map(
                this.filterProjection({
                    min: this.createDatetimeProjection(Cypher.min(variable)),
                    max: this.createDatetimeProjection(Cypher.max(variable)),
                })
            );
        }
        if (this.attribute.typeHelper.isTemporal()) {
            return new Cypher.Map(
                this.filterProjection({
                    min: Cypher.min(variable),
                    max: Cypher.max(variable),
                })
            );
        }

        if (this.attribute.typeHelper.isID()) {
            return new Cypher.Map(
                this.filterProjection({
                    shortest: Cypher.min(variable),
                    longest: Cypher.max(variable),
                })
            );
        }
        throw new Error(`Invalid aggregation type ${this.attribute.type.name}`);
    }

    private filterProjection(projectionFields: Record<string, Cypher.Expr>): Record<string, Cypher.Expr> {
        const filteredFields = filterFields(projectionFields, Object.keys(this.aggregationProjection));
        return renameFields(filteredFields, this.aggregationProjection);
    }

    private createDatetimeProjection(expr: Cypher.Expr) {
        return Cypher.apoc.date.convertFormat(expr, "iso_zoned_date_time", "iso_offset_date_time");
    }
}
