import { ResolveTree } from "graphql-parse-resolve-info";
import Relationship from "../../../classes/Relationship";
import createDatetimeElement from "./create-datetime-element";
import createPointElement from "./create-point-element";

function createRelationshipPropertyEntry({
    resolveTree,
    relationship,
    relationshipVariable,
}: {
    resolveTree: ResolveTree;
    relationship: Relationship;
    relationshipVariable: string;
}): string {
    const datetimeField = relationship.fields.find(
        (f) => f.fieldName === resolveTree.name && f.typeMeta.name === "DateTime"
    );
    const pointField = relationship.fields.find(
        (f) => f.fieldName === resolveTree.name && ["Point", "CartesianPoint"].includes(f.typeMeta.name)
    );

    if (datetimeField)
        return createDatetimeElement({ resolveTree, field: datetimeField, variable: relationshipVariable });

    if (pointField) return createPointElement({ resolveTree, field: pointField, variable: relationshipVariable });

    return `${resolveTree.alias}: ${relationshipVariable}.${resolveTree.name}`;
}

export default createRelationshipPropertyEntry;
