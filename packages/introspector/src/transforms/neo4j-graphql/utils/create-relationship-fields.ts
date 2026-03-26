/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
