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

        const pathMatchStr = `MATCH p=(${varName})${inStr}${relTypeStr}${outStr}(${toNode.getLabelString(context)})`;
        const countNodesStr = `count(nodes(p))`;
        const relationshipLength = 1;
        const comparisonOperator = `=`;
        const comparison = `${countNodesStr} ${comparisonOperator} ${relationshipLength}`;
        const apocRunFirstCol = `
            apoc.cypher.runFirstColumn('${pathMatchStr}\nRETURN ${comparison}', { ${varName}: ${varName} }, false)
        `;

        return `apoc.util.validatePredicate(NOT(${apocRunFirstCol}), '${RELATIONSHIP_REQUIREMENT_PREFIX}${node.name}.${field.fieldName} required', [0])`;
    });

    relationshipValidationStr = `CALL apoc.util.validate(NOT(${nonNullPredicates.join(
        " AND "
    )}), '${RELATIONSHIP_REQUIREMENT_PREFIX}', [0])`;

    return relationshipValidationStr;
}

export default createRelationshipValidationString;
