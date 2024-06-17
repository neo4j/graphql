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
import { AttributeField } from "./AttributeField";

export class SpatialAttributeField extends AttributeField {
    private crs: boolean; // crs flag is used to determine if the crs field should be included in the projection

    constructor({ attribute, alias, crs }: { attribute: AttributeAdapter; alias: string; crs: boolean }) {
        super({ alias, attribute });
        this.crs = crs;
    }

    public getProjectionField(variable: Cypher.Variable): Record<string, Cypher.Expr> {
        const pointProjection = this.createPointProjection(variable);
        return { [this.alias]: pointProjection };
    }

    protected getCypherExpr(target: Cypher.Variable): Cypher.Expr {
        return this.createPointProjection(target);
    }

    private createPointProjection(variable: Cypher.Variable): Cypher.Expr {
        const pointProperty = variable.property(this.attribute.databaseName);

        const caseStatement = new Cypher.Case().when(Cypher.isNotNull(pointProperty));

        // Sadly need to select the whole point object due to the risk of height/z
        // being selected on a 2D point, to which the database will throw an error
        if (this.attribute.typeHelper.isList()) {
            const arrayProjection = this.createPointArrayProjection(pointProperty);
            return caseStatement.then(arrayProjection).else(Cypher.Null);
        } else {
            const pointProjection = this.createPointProjectionMap(pointProperty);
            return caseStatement.then(pointProjection).else(Cypher.Null);
        }
    }

    private createPointArrayProjection(pointProperty: Cypher.Property): Cypher.Expr {
        const projectionVar = new Cypher.Variable();

        const projectionMap = this.createPointProjectionMap(projectionVar);

        return new Cypher.ListComprehension(projectionVar).in(pointProperty).map(projectionMap);
    }

    private createPointProjectionMap(variable: Cypher.Variable | Cypher.Property): Cypher.Map {
        const projectionMap = new Cypher.Map();
        projectionMap.set({ point: variable });

        if (this.crs) {
            projectionMap.set({ crs: variable.property("crs") });
        }

        return projectionMap;
    }
}
