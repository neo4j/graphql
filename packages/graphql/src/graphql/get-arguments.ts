import { GraphQLResolveInfo, ArgumentNode } from "graphql";

function getArguments(resolveInfo: GraphQLResolveInfo, name): ArgumentNode[] {
    const node = resolveInfo.fieldNodes.find((n) => n.name.value === name);

    const args = node?.arguments as ArgumentNode[];

    return args;
}

export default getArguments;
