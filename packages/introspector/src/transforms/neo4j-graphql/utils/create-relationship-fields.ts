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

import { RelationshipDirective } from "../directives/Relationship";
import { NodeField } from "../NodeField";
import generateRelationshipFieldName from "./generate-relationship-field-name";

export default function createRelationshipFields(
    fromTypeName: string,
    toTypeName: string,
    relType: string,
    propertiesTypeName?: string
): { fromField: NodeField; toField: NodeField } {
    const fromField = new NodeField(
        generateRelationshipFieldName(relType, fromTypeName, toTypeName, "OUT"),
        `[${toTypeName}!]!`
    );
    const fromDirective = new RelationshipDirective(relType, "OUT", propertiesTypeName);
    fromField.addDirective(fromDirective);

    const toField = new NodeField(
        generateRelationshipFieldName(relType, fromTypeName, toTypeName, "IN"),
        `[${fromTypeName}!]!`
    );
    const toDirective = new RelationshipDirective(relType, "IN", propertiesTypeName);
    toField.addDirective(toDirective);
    return { fromField, toField };
}
