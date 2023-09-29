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
import { AttributeField } from "./AttributeField";

export class DateTimeField extends AttributeField {
    protected getCypherExpr(target: Cypher.Variable): Cypher.Expr {
        const targetProperty = target.property(this.attribute.databaseName);

        return this.createDateTimeProjection(targetProperty);
    }

    public getProjectionField(variable: Cypher.Variable): Record<string, Cypher.Expr> {
        const targetProperty = variable.property(this.attribute.databaseName);
        const fieldExpr = this.createDateTimeProjection(targetProperty);
        return { [this.alias]: fieldExpr };
    }

    private createDateTimeProjection(targetProperty: Cypher.Property): Cypher.Expr {
        if (this.attribute.typeHelper.isList()) {
            return this.createArrayProjection(targetProperty);
        }
        return this.createApocConvertFormat(targetProperty);
    }

    private createArrayProjection(targetProperty: Cypher.Property): Cypher.Expr {
        const comprehensionVariable = new Cypher.Variable();
        const apocFormat = this.createApocConvertFormat(comprehensionVariable);

        return new Cypher.ListComprehension(comprehensionVariable).in(targetProperty).map(apocFormat);
    }

    private createApocConvertFormat(variableOrProperty: Cypher.Variable | Cypher.Property): Cypher.Function {
        return Cypher.apoc.date.convertFormat(variableOrProperty, "iso_zoned_date_time", "iso_offset_date_time");
    }
}
