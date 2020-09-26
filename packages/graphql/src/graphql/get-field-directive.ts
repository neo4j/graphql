import { DirectiveNode, FieldDefinitionNode } from "graphql";

function getFieldDirective(field: FieldDefinitionNode, name: string): DirectiveNode | undefined {
    return field.directives?.find((x) => x.name.value === name);
}

export default getFieldDirective;
