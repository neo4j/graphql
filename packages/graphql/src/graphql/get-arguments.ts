import { GraphQLResolveInfo, ArgumentNode } from "graphql";

function getArguments(resolveInfo: GraphQLResolveInfo): ArgumentNode[] {
    const node = resolveInfo.fieldNodes.find((n) => n.name.value === resolveInfo.fieldName);

    const args = node?.arguments as ArgumentNode[];

    return args;
}

export default getArguments;
