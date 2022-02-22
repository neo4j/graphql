import { ObjectTypeDefinitionNode } from "graphql";

const rootTypes = ["Query", "Mutation", "Subscription"];

export function isRootType(definition: ObjectTypeDefinitionNode) {
    return rootTypes.includes(definition.name.value);
}
