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
import type { Attribute } from "../../../../schema-model/attribute/Attribute";
import { AttributeType } from "../../../../schema-model/attribute/Attribute";
import { AttributeField } from "./AttributeField";

export class PointAttributeField extends AttributeField {
    private crs: boolean;

    constructor({ attribute, alias, crs }: { attribute: Attribute; alias: string; crs: boolean }) {
        super(attribute);
        this.crs = crs;
        this.alias = alias;
        if (this.attribute.type !== AttributeType.Point) {
            throw new Error("Point attribute fields cannot have non-point attribute");
        }
    }

    public getProjectionField(variable: Cypher.Variable): string | Record<string, Cypher.Expr> {
        console.log("get projection field point");
        const nodeProperty = this.createPointProjection(variable);
        return { [this.alias || this.attribute.name]: nodeProperty }; // TODO: make alias required

        // return [this.attribute.name];
    }

    private createPointProjection(variable: Cypher.Variable): Cypher.Expr {
        const pointProperty = variable.property(this.attribute.name);

        // Sadly need to select the whole point object due to the risk of height/z
        // being selected on a 2D point, to which the database will throw an error
        let caseResult: Cypher.Expr;
        if (this.attribute.isArray) {
            const projectionVar = new Cypher.Variable();

            const projectionMap = this.createPointProjectionMap(projectionVar);

            caseResult = new Cypher.ListComprehension(projectionVar)
                .in(variable.property(this.attribute.name))
                .map(projectionMap);
        } else {
            caseResult = this.createPointProjectionMap(pointProperty);
        }

        return new Cypher.Case().when(Cypher.isNotNull(pointProperty)).then(caseResult).else(Cypher.Null);
    }

    private createPointProjectionMap(variable: Cypher.Variable | Cypher.Property): Cypher.Map {
        const projectionMap = new Cypher.Map();
        projectionMap.set({ point: variable });

        // if (point) {
        //     projectionMap.set({ point: variableOrProperty });
        // }
        if (this.crs) {
            projectionMap.set({ crs: variable.property("crs") });
        }

        return projectionMap;
    }
}
