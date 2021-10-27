import {
    BooleanValueNode,
    DirectiveNode,
    InterfaceTypeDefinitionNode,
    ObjectTypeDefinitionNode,
    StringValueNode,
} from "graphql";
import { Unique } from "../../types";

// eslint-disable-next-line consistent-return
function parseUnique(
    directives: DirectiveNode[],
    type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    fieldName: string
): Unique | undefined {
    const uniqueDirective = directives.find((x) => x.name.value === "unique");

    if (uniqueDirective && type.kind === "InterfaceTypeDefinition") {
        throw new Error(`@unique directive cannot be used on interface type fields: ${type.name.value}.${fieldName}`);
    }

    if (uniqueDirective) {
        return {
            constraintName:
                (uniqueDirective.arguments?.find((a) => a.name.value === "constraintName")?.value as
                    | StringValueNode
                    | undefined)?.value || `${type.name.value}_${fieldName}`,
        };
    }

    let uniqueId = false;

    const idDirective = directives.find((x) => x.name.value === "id");

    if (idDirective) {
        const idDirectiveUniqueArgument = idDirective?.arguments?.find((a) => a.name.value === "unique")?.value as
            | BooleanValueNode
            | undefined;
        // If unique argument is absent from @id directive, default is to use unique constraint
        uniqueId = idDirectiveUniqueArgument ? idDirectiveUniqueArgument.value : true;
    }

    if (uniqueId) {
        return {
            constraintName: `${type.name.value}_${fieldName}`,
        };
    }
}

export default parseUnique;
