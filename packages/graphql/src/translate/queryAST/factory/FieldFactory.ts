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

import type { ResolveTree } from "graphql-parse-resolve-info";
import type { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import { AttributeField } from "../ast/fields/AttributeField";
import type { Field } from "../ast/fields/Field";
import { parseSelectionSetField } from "./parsers/parse-selection-set-fields";
import { filterTruthy } from "../../../utils/utils";
import type { QueryASTFactory } from "./QueryASTFactory";
import { ConnectionField } from "../ast/fields/ConnectionField";
import type { Relationship } from "../../../schema-model/relationship/Relationship";

export class FieldFactory {
    private queryASTFactory: QueryASTFactory;
    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
    }

    public createFields(entity: ConcreteEntity, rawFields: Record<string, ResolveTree>): Field[] {
        return filterTruthy(
            Object.values(rawFields).map((field: ResolveTree) => {
                const { fieldName, isConnection } = parseSelectionSetField(field.name);
                if (isConnection) {
                    return this.createConnectionField(entity, fieldName, field);
                }
                const attribute = entity.findAttribute(fieldName);
                if (!attribute) throw new Error("attribute not found");

                const attr = new AttributeField(attribute);
                attr.alias = field.alias;
                return attr;
            })
        );
    }

    public createRelationshipFields(entity: Relationship, rawFields: Record<string, ResolveTree>): Field[] {
        return filterTruthy(
            Object.values(rawFields).map((field: ResolveTree) => {
                const { fieldName } = parseSelectionSetField(field.name);

                const attribute = entity.findAttribute(fieldName);
                if (!attribute) throw new Error("attribute not found");

                const attr = new AttributeField(attribute);
                attr.alias = field.alias;
                return attr;
            })
        );
    }

    private createConnectionField(entity: ConcreteEntity, fieldName: string, field: ResolveTree): ConnectionField {
        const relationship = entity.findRelationship(fieldName);
        if (!relationship) throw new Error(`relationship  ${fieldName} not found`);
        const connectionOp = this.queryASTFactory.operationsFactory.createConnectionOperationAST(relationship, field);

        return new ConnectionField({
            operation: connectionOp,
            alias: field.alias,
        });
    }
}
