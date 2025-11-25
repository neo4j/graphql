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
import type { AttributeAdapter } from "../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { QueryASTContext } from "../QueryASTContext";
import { InputField } from "./InputField";

// TODO: this should be the default case (PropertyInputField)
/** Input field from a parameter
 * it will generate a set operation from param, if a Cypher.Variable or Param is passed, it will be used
 * otherwise, the value will be wrapped in a param
 *
 * ```cypher
 * CREATE (var0:Movie)
 * SET
 *   this.id = $param0
 * ```
 */
export class ParamInputField extends InputField {
    protected attribute: AttributeAdapter;
    protected inputValue: unknown;

    private param: Cypher.Variable;

    constructor({
        attribute,
        attachedTo,
        inputValue,
    }: {
        attribute: AttributeAdapter;
        attachedTo: "node" | "relationship";
        inputValue: unknown;
    }) {
        super(attribute.name, attachedTo);
        this.attribute = attribute;
        this.inputValue = inputValue;
        this.param = this.inputValue instanceof Cypher.Variable ? this.inputValue : new Cypher.Param(this.inputValue);
    }

    public getChildren() {
        return [];
    }

    public getSetParams(
        queryASTContext: QueryASTContext<Cypher.Node>,
        _inputVariable?: Cypher.Variable
    ): Cypher.SetParam[] {
        const param = this.getParam();
        // This check is needed for populatedBy callbacks
        if (param instanceof Cypher.Param) {
            if (param.value === undefined) {
                return [];
            }
        }
        const leftExpr = this.getLeftExpression(queryASTContext);
        const rightExpr = this.getRightExpression(queryASTContext);

        const setField: Cypher.SetParam = [leftExpr, rightExpr];
        return [setField];
    }

    protected getLeftExpression(queryASTContext: QueryASTContext<Cypher.Node>): Cypher.Property {
        return this.getTarget(queryASTContext).property(this.attribute.databaseName);
    }

    protected getParam(): Cypher.Variable {
        return this.param;
    }

    protected getRightExpression(
        _context: QueryASTContext<Cypher.Node>
    ): Exclude<Cypher.Expr, Cypher.Map | Cypher.MapProjection> {
        const rightVariable = this.getParam();
        return this.coerceReference(rightVariable);
    }

    protected coerceReference(
        variable: Cypher.Variable | Cypher.Property
    ): Exclude<Cypher.Expr, Cypher.Map | Cypher.MapProjection> {
        if (this.attribute.typeHelper.isSpatial()) {
            if (!this.attribute.typeHelper.isList()) {
                return Cypher.point(variable);
            }
            const comprehensionVar = new Cypher.Variable();
            const mapPoint = Cypher.point(comprehensionVar);
            return new Cypher.ListComprehension(comprehensionVar).in(variable).map(mapPoint);
        }

        if (this.attribute.typeHelper.isDateTime()) {
            if (!this.attribute.typeHelper.isList()) {
                return Cypher.datetime(variable);
            }
            const comprehensionVar = new Cypher.Variable();
            const mapDateTime = Cypher.datetime(comprehensionVar);
            return new Cypher.ListComprehension(comprehensionVar).in(variable).map(mapDateTime);
        }

        if (this.attribute.typeHelper.isTime()) {
            if (!this.attribute.typeHelper.isList()) {
                return Cypher.time(variable);
            }
            const comprehensionVar = new Cypher.Variable();
            const mapTime = Cypher.time(comprehensionVar);
            return new Cypher.ListComprehension(comprehensionVar).in(variable).map(mapTime);
        }
        return variable;
    }
}
