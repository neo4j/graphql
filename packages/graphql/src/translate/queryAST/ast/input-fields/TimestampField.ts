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
import type { CypherFunction } from "@neo4j/cypher-builder/dist/expressions/functions/CypherFunctions";
import { Neo4jGraphQLTemporalType } from "../../../../schema-model/attribute/AttributeType";
import type { AttributeAdapter } from "../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { QueryASTContext } from "../QueryASTContext";
import { InputField } from "./InputField";

export class TimestampField extends InputField {
    private attribute: AttributeAdapter;
    private attachedTo: "node" | "relationship";


    constructor(name: string, attribute: AttributeAdapter, attachedTo: "node" | "relationship" = "node") {
        super(name);
        this.attribute = attribute;
        this.attachedTo = attachedTo;

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

        // DateTime -> datetime(); Time -> time()
        const relatedCypherExpression = this.getCypherTemporalFunction(this.attribute.type.name as Neo4jGraphQLTemporalType);
        if (this.attribute.databaseName) {
            [cypherNodeRef.property(attribute.databaseName), relatedCypherExpression];
        }
        return [setField];
    }

    public getSetClause(): Cypher.Clause[] {
        return [];
    }


    private getTarget(): Cypher.Node | Cypher.Relationship {

    }

    private getCypherTemporalFunction(type: Neo4jGraphQLTemporalType): CypherFunction {
        switch (type) {
            case Neo4jGraphQLTemporalType.DateTime:
                return Cypher.datetime();

            case Neo4jGraphQLTemporalType.LocalDateTime:
                return Cypher.localdatetime();

            case Neo4jGraphQLTemporalType.Time:
                return Cypher.time();

            case Neo4jGraphQLTemporalType.LocalTime:
                return Cypher.localtime();

            default: {
                throw new Error(`Transpile error: Expected type to one of:
                [ 
                    ${Neo4jGraphQLTemporalType.DateTime},
                    ${Neo4jGraphQLTemporalType.LocalDateTime}, 
                    ${Neo4jGraphQLTemporalType.Time},
                    ${Neo4jGraphQLTemporalType.LocalTime}
                ]
                but found ${type} instead`);
            }
        }
    }
}
