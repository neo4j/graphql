/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import { apocWrapper } from "../../../../utils/apoc-wrapper";
import { coalesceValueIfNeeded } from "../../filters/utils/coalesce-if-needed";
import { AttributeField } from "./AttributeField";

export class DateTimeField extends AttributeField {
    protected getCypherExpr(target: Cypher.Variable): Cypher.Expr {
        const targetProperty = target.property(this.attribute.databaseName);

        return this.createDateTimeProjection(targetProperty);
    }

    public getProjectionField(variable: Cypher.Variable): Record<string, Cypher.Expr> {
        const targetProperty = variable.property(this.attribute.databaseName);
        const fieldExpr = this.createDateTimeProjection(targetProperty);
        return { [this.alias]: coalesceValueIfNeeded(this.attribute, fieldExpr) };
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
        return apocWrapper.convertFormat(variableOrProperty, "iso_zoned_date_time", "iso_offset_date_time");
    }
}
