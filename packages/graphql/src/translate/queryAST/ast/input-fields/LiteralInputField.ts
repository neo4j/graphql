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

import type Cypher from "@neo4j/cypher-builder";
import type { AttributeAdapter } from "../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { QueryASTContext } from "../QueryASTContext";
import { InputField } from "./InputField";

export class LiteralInputField extends InputField {
    private attribute: AttributeAdapter;
    private literalValue: Cypher.Literal;

    constructor(name: string, attribute: AttributeAdapter, literalValue: Cypher.Literal) {
        super(name);
        this.attribute = attribute;
        this.literalValue = literalValue;
    }
    public getChildren() {
        return [];
    }

    public print(): string {
        return `${super.print()} <${this.name}>`;
    }

    public getSetFields(queryASTContext: QueryASTContext<Cypher.Node>): Cypher.SetParam[] {
        const setField: Cypher.SetParam = [
            queryASTContext.target.property(this.attribute.databaseName),
            this.literalValue,
        ];
        return [setField];
    }

    public getSetClause(): Cypher.Clause[] {
        return [];
    }
}
