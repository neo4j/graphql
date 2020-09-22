import { GraphQLResolveInfo, SelectionNode } from "graphql";

export type Context = Record<string, unknown>;

export function cypherQuery(args: any, _context: Context, resolveInfo: GraphQLResolveInfo): [string, any] {
    const { returnType: typeName } = resolveInfo;
    const schemaType = resolveInfo.schema.getType(typeName.toString());
    console.log("schemaType: ", schemaType);
    const selections = getPayloadSelections(resolveInfo);
    console.log("selections: ", selections);
    const typeMap = resolveInfo.schema.getTypeMap();
    console.log("typeMap: ", typeMap);
    return ["MATCH (`movie`:`Movie`) RETURN `movie` { .title } AS `movie`", args];
}

function getPayloadSelections(resolveInfo: GraphQLResolveInfo): SelectionNode[] | undefined {
    const filteredFieldNodes = resolveInfo.fieldNodes.filter((n) => n.name.value === resolveInfo.fieldName);

    const payloadTypeNode = filteredFieldNodes.shift();
    const selections = payloadTypeNode?.selectionSet?.selections as SelectionNode[];
    return selections;
}
