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

export class IdField extends InputField {
    private attribute: AttributeAdapter;

    constructor(name: string, attribute: AttributeAdapter, attachedTo: "node" | "relationship" = "node") {
        super(name, attachedTo);
        this.attribute = attribute;
    }
    public getChildren() {
        return [];
    }

    public print(): string {
        return `${super.print()} <${this.name}>`;
    }

    public getSetParams(queryASTContext: QueryASTContext<Cypher.Node>): Cypher.SetParam[] {
        const target = this.getTarget(queryASTContext);
        const setParam: Cypher.SetParam = [target.property(this.attribute.databaseName), Cypher.randomUUID()];
        return [setParam];
    }

    public getSetClause(): Cypher.Clause[] {
        return [];
    }
}
