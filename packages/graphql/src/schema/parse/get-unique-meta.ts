import {
    BooleanValueNode,
    DirectiveNode,
    InterfaceTypeDefinitionNode,
    Kind,
    ObjectTypeDefinitionNode,
    StringValueNode,
} from "graphql";
import { Unique } from "../../types";

// eslint-disable-next-line consistent-return
function getUniqueMeta(
    directives: DirectiveNode[],
    type: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    fieldName: string
): Unique | undefined {
    const uniqueDirective = directives.find((x) => x.name.value === "unique");

    if (uniqueDirective && type.kind === Kind.INTERFACE_TYPE_DEFINITION) {
        throw new Error(`@unique directive cannot be used on interface type fields: ${type.name.value}.${fieldName}`);
    }

    if (uniqueDirective) {
        const constraintName = uniqueDirective.arguments?.find((a) => a.name.value === "constraintName");
        return {
            constraintName: constraintName
                ? (constraintName.value as StringValueNode).value
                : `${type.name.value}_${fieldName}`,
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

export default getUniqueMeta;
