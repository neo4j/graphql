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
    private propertyReference: Exclude<Cypher.Expr, Cypher.Map | Cypher.MapProjection>;
    public attachedTo: "node" | "relationship";

    constructor({
        attribute,
        reference,
        attachedTo = "node",
    }: {
        attribute: AttributeAdapter;
        reference: Cypher.Property;
        attachedTo?: "node" | "relationship";
    }) {
        super(attribute.name, attachedTo);
        this.attribute = attribute;
        this.propertyReference = reference;
        this.attachedTo = attachedTo;
    }

    public getChildren() {
        return [];
    }

    public print(): string {
        return `${super.print()} <${this.name}>`;
    }

    public getSetFields(queryASTContext: QueryASTContext<Cypher.Node>): Cypher.SetParam[] {
        const target = this.attachedTo === "node" ? queryASTContext.target : queryASTContext.relationship;
        if (!target) {
            throw new Error("No target found");
        }
        const leftExpr = target.property(this.attribute.databaseName);
        const rightExpr = this.coerceReference();

        const setField: Cypher.SetParam = [leftExpr, rightExpr];
        return [setField];
    }

    private coerceReference(): Exclude<Cypher.Expr, Cypher.Map | Cypher.MapProjection> {
        if (this.attribute.typeHelper.isSpatial()) {
            if (!this.attribute.typeHelper.isList()) {
                return Cypher.point(this.propertyReference);
            }
            const comprehensionVar = new Cypher.Variable();
            const mapPoint = Cypher.point(comprehensionVar);
            return new Cypher.ListComprehension(comprehensionVar, this.propertyReference).map(mapPoint);
        }
        return this.propertyReference;
    }

    public getSetClause(): Cypher.Clause[] {
        return [];
    }
}
