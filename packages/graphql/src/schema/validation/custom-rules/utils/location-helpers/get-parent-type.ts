import { type ASTNode } from "graphql";
import type { TypeMapWithExtensions } from "../../../Neo4jValidationContext";
import { getPathToNode } from "../path-parser";

export function getParentType({
    path,
    ancestors,
    typeMapWithExtensions,
}: {
    path: readonly (string | number)[];
    ancestors: readonly (ASTNode | readonly ASTNode[])[];
    typeMapWithExtensions: TypeMapWithExtensions;
}) {
    const [pathToNode, _traversedDef, parentOfTraversedDef] = getPathToNode(path, ancestors);
    if (!parentOfTraversedDef) {
        throw new Error(
            `Internal validation error: field with path: ${pathToNode.join(", ")} is in a type that does not exist in the typeMapWithExtensions`
        );
    }
    const parentTypeAndExtensions = typeMapWithExtensions[parentOfTraversedDef.name.value];
    if (!parentTypeAndExtensions) {
        throw new Error(
            `Internal validation error: field with path: ${pathToNode.join(", ")} is in a type that does not exist in the typeMapWithExtensions`
        );
    }
    return parentTypeAndExtensions;
}
