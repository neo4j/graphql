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

export class ReferenceInputField extends InputField {
    private attribute: AttributeAdapter;
    private refPath: string[];
    constructor({
        attribute,
        attachedTo,
        refPath,
    }: {
        attribute: AttributeAdapter;
        attachedTo: "node" | "relationship";
        refPath: string[];
    }) {
        super(attribute.name, attachedTo);
        this.attribute = attribute;
        this.refPath = refPath;
    }

    public getChildren() {
        return [];
    }

    public print(): string {
        return `${super.print()} <${this.name}>`;
    }

    public getSetFields(
        queryASTContext: QueryASTContext<Cypher.Node>,
        inputVariable?: Cypher.Variable
    ): Cypher.SetParam[] {
        const target = this.getTarget(queryASTContext);

        if (!inputVariable) {
            throw new Error("Transpile Error: No input variable found");
        }
        const rightVariable = this.getVariablePath(inputVariable, this.refPath);

        const leftExpr = target.property(this.attribute.databaseName);
        const rightExpr = this.coerceReference(rightVariable);

        const setField: Cypher.SetParam = [leftExpr, rightExpr];
        return [setField];
    }

    private getVariablePath(
        variable: Cypher.Property | Cypher.Variable,
        path: string[]
    ): Cypher.Property | Cypher.Variable {
        const next = path.shift();
        if (next === undefined) {
            return variable;
        }
        return this.getVariablePath(variable.property(next), path);
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
        return variable;
    }

    public getSetClause(): Cypher.Clause[] {
        return [];
    }
}
