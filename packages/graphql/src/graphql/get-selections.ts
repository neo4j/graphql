import { GraphQLResolveInfo, SelectionNode } from "graphql";

function getSelections(resolveInfo: GraphQLResolveInfo): SelectionNode[] | undefined {
    const node = resolveInfo.fieldNodes.find((n) => n.name.value === resolveInfo.fieldName);

    const selections = node?.selectionSet?.selections as SelectionNode[];

    return selections;
}

export default getSelections;
