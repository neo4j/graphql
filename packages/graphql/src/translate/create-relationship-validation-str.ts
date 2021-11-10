import { Node } from "../classes";
import { RELATIONSHIP_REQUIREMENT_PREFIX } from "../constants";
import { Context } from "../types";

function createRelationshipValidationStr({
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
        const isRequired = field.typeMeta.required;
        const isArrayTypeRequired = field.typeMeta.arrayTypeRequired;
        const isArray = field.typeMeta.array;
        const isNotUnionOrInterface = Boolean(field.union) || Boolean(field.interface);

        if (isArray) {
            return isArrayTypeRequired && !isNotUnionOrInterface;
        }

        return isRequired && !isNotUnionOrInterface;
    });

    if (nonNullRelationFields.length) {
        const nonNullPredicates = nonNullRelationFields.map((field) => {
            const inStr = field.direction === "IN" ? "<-" : "-";
            const outStr = field.direction === "OUT" ? "->" : "-";
            const relTypeStr = `[:${field.type}]`;
            const toNode = context.neoSchema.nodes.find((n) => n.name === field.typeMeta.name) as Node;
            const exitsStr = `EXISTS((${varName})${inStr}${relTypeStr}${outStr}(${toNode.getLabelString(context)}))`;

            return `apoc.util.validatePredicate(NOT(${exitsStr}), '${RELATIONSHIP_REQUIREMENT_PREFIX}${node.name}.${field.fieldName} required', [0])`;
        });

        relationshipValidationStr = `CALL apoc.util.validate(NOT(${nonNullPredicates.join(
            " AND "
        )}), '${RELATIONSHIP_REQUIREMENT_PREFIX}', [0])`;
    }

    return relationshipValidationStr;
}

export default createRelationshipValidationStr;
