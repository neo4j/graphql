import { Node } from "../classes";
import { RELATIONSHIP_REQUIREMENT_PREFIX } from "../constants";
import { Context } from "../types";

function createRelationshipValidationString({
    node,
    context,
    varName,
}: {
    node: Node;
    context: Context;
    varName: string;
}): string {
    let relationshipValidationStr = "";

    const nonNullRelationFields = node.relationFields.filter((field) => {
        if (field.typeMeta.array) {
            return false;
        }

        const isRequired = field.typeMeta.required;
        const isNotUnionOrInterface = Boolean(field.union) || Boolean(field.interface);

        return isRequired && !isNotUnionOrInterface;
    });

    if (!nonNullRelationFields.length) {
        return relationshipValidationStr;
    }

    const nonNullPredicates = nonNullRelationFields.map((field) => {
        const toNode = context.neoSchema.nodes.find((n) => n.name === field.typeMeta.name) as Node;

        const inStr = field.direction === "IN" ? "<-" : "-";
        const outStr = field.direction === "OUT" ? "->" : "-";
        const relTypeStr = `[:${field.type}]`;

        const subQuery = [
            `CALL {`,
            `\tWITH ${varName}`,
            `\tMATCH p=(${varName})${inStr}${relTypeStr}${outStr}(${toNode.getLabelString(context)})`,
            `\tWITH count(nodes(p)) AS c`,
            `\tCALL apoc.util.validate(NOT(c = 1), '${RELATIONSHIP_REQUIREMENT_PREFIX}${node.name}.${field.fieldName} required', [0])`,
            `\tRETURN c AS ${varName}_${field.fieldName}_${toNode.name}_unique_ignored`,
            `}`,
        ].join("\n");

        return subQuery;
    });

    return nonNullPredicates.join("\n");
}

export default createRelationshipValidationString;
