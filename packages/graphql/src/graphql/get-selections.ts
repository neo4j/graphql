import { GraphQLResolveInfo, SelectionNode } from "graphql";

function getSelections(resolveInfo: GraphQLResolveInfo, name: string): SelectionNode[] | undefined {
    const node = resolveInfo.fieldNodes.find((n) => n.name.value === name);

    const selections = node?.selectionSet?.selections as SelectionNode[];

    return selections;
}

export default getSelections;
