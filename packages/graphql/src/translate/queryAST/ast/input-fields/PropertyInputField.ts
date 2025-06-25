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

/** Input field from a property,
 * given an inputVariable it will generate a set operation from a property of that variable
 *
 * ```cypher
 * CREATE (var0:Movie)
 * SET
 *   this.id = var0.id
 * ```
 */
export class PropertyInputField extends InputField {
    private attribute: AttributeAdapter;

    constructor({ attribute, attachedTo }: { attribute: AttributeAdapter; attachedTo: "node" | "relationship" }) {
        super(attribute.name, attachedTo);
        this.attribute = attribute;
    }

    public getChildren() {
        return [];
    }

    public getSetParams(
        queryASTContext: QueryASTContext<Cypher.Node>,
        inputVariable?: Cypher.Variable
    ): Cypher.SetParam[] {
        const target = this.getTarget(queryASTContext);

        if (!inputVariable) {
            throw new Error("Transpile Error: No input variable found");
        }
        const rightVariable = this.getVariablePath(queryASTContext, inputVariable);

        const leftExpr = target.property(this.attribute.databaseName);
        const rightExpr = this.coerceReference(rightVariable);

        const setField: Cypher.SetParam = [leftExpr, rightExpr];
        return [setField];
    }

    private getVariablePath(
        queryASTContext: QueryASTContext<Cypher.Node>,
        variable: Cypher.Property | Cypher.Variable
    ): Cypher.Property | Cypher.Variable {
        const path = this.attachedTo === "node" ? "node" : "edge";
        if (queryASTContext.relationship) {
            return variable.property(path).property(this.attribute.name);
        }
        return variable.property(this.attribute.name);
    }

    private coerceReference(
        variable: Cypher.Variable | Cypher.Property
    ): Exclude<Cypher.Expr, Cypher.Map | Cypher.MapProjection> {
        if (this.attribute.typeHelper.isSpatial()) {
            if (!this.attribute.typeHelper.isList()) {
                return Cypher.point(variable);
            }
            const comprehensionVar = new Cypher.Variable();
            const mapPoint = Cypher.point(comprehensionVar);
            return new Cypher.ListComprehension(comprehensionVar, variable).map(mapPoint);
        }

        if (this.attribute.typeHelper.isDateTime()) {
            if (!this.attribute.typeHelper.isList()) {
                return Cypher.datetime(variable);
            }
            const comprehensionVar = new Cypher.Variable();
            const mapDateTime = Cypher.datetime(comprehensionVar);
            return new Cypher.ListComprehension(comprehensionVar, variable).map(mapDateTime);
        }

        if (this.attribute.typeHelper.isTime()) {
            if (!this.attribute.typeHelper.isList()) {
                return Cypher.time(variable);
            }
            const comprehensionVar = new Cypher.Variable();
            const mapTime = Cypher.time(comprehensionVar);
            return new Cypher.ListComprehension(comprehensionVar, variable).map(mapTime);
        }

        return variable;
    }
}
