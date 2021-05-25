import {
    ArgumentNode,
    FieldNode,
    GraphQLResolveInfo,
    ObjectFieldNode,
    SelectionNode,
    ValueNode,
    VariableDefinitionNode,
} from "graphql";
import { parseResolveInfo, ResolveTree } from "graphql-parse-resolve-info";
import neo4j from "neo4j-driver";

function getNeo4jArgumentValue(
    value: any,
    valueNode: ValueNode,
    variableDefinitions: readonly VariableDefinitionNode[] | undefined
) {
    switch (valueNode.kind) {
        case "BooleanValue":
        case "EnumValue":
        case "FloatValue":
        case "NullValue":
        case "StringValue":
            return value;
        case "IntValue":
            return neo4j.int(value);
        case "Variable":
            // eslint-disable-next-line no-case-declarations
            const variable = variableDefinitions?.find((v) => v.variable.name.value === valueNode.name.value);

            switch (variable?.type.kind) {
                case "ListType":
                    break;
                case "NamedType":
                    if (variable.type.name.value === "Int") {
                        return neo4j.int(value);
                    }
                    return value;
                case "NonNullType":
                    break;
                default:
                    throw new Error();
            }

            return value;
        case "ListValue":
            return value.map((v, i) => getNeo4jArgumentValue(v, valueNode.values[i], variableDefinitions));
        case "ObjectValue":
            return Object.entries(value).reduce((res, [k, v]) => {
                const vNode = valueNode.fields.find((f) => f.name.value === k) as ObjectFieldNode;

                if (Array.isArray(v) && vNode.value.kind !== "ListValue") {
                    return { ...res, [k]: v.map((v1) => getNeo4jArgumentValue(v1, vNode.value, variableDefinitions)) };
                }

                return { ...res, [k]: getNeo4jArgumentValue(v, vNode.value, variableDefinitions) };
            }, {});
        default:
            throw new Error();
    }
}

function getNeo4jFieldsByTypeName(
    resolveTree: ResolveTree,
    fieldNodes: readonly SelectionNode[],
    variableDefinitions: readonly VariableDefinitionNode[] | undefined
) {
    const fieldNode = fieldNodes.find((n) => n.kind === "Field" && n.name.value === resolveTree.name) as FieldNode;

    if (!fieldNode) return resolveTree;

    const args = Object.entries(resolveTree.args).reduce((a, [name, value]) => {
        const argumentNode = fieldNode.arguments?.find((argument) => argument.name.value === name) as ArgumentNode;

        return {
            ...a,
            [name]: getNeo4jArgumentValue(value, argumentNode?.value, variableDefinitions),
        };
    }, {});

    const fieldsByTypeName = Object.entries(resolveTree.fieldsByTypeName).reduce((f, [k, v]) => {
        const resolveTrees = Object.entries(v).reduce((t, [k1, v1]) => {
            return {
                ...t,
                [k1]: getNeo4jFieldsByTypeName(
                    v1,
                    fieldNode.selectionSet?.selections as FieldNode[],
                    variableDefinitions
                ),
            };
        }, {});

        return {
            ...f,
            [k]: resolveTrees,
        };
    }, {});

    const { alias, name } = resolveTree;

    return { alias, args, fieldsByTypeName, name } as ResolveTree;
}

function getNeo4jResolveTree(resolveInfo: GraphQLResolveInfo) {
    const resolveTree = parseResolveInfo(resolveInfo) as ResolveTree;
    const fieldNode = resolveInfo.fieldNodes.find((n) => n.name.value === resolveTree.name) as FieldNode;

    const args = Object.entries(resolveTree.args).reduce((a, [name, value]) => {
        const argumentNode = fieldNode.arguments?.find((argument) => argument.name.value === name) as ArgumentNode;

        return {
            ...a,
            [name]: getNeo4jArgumentValue(value, argumentNode?.value, resolveInfo.operation.variableDefinitions),
        };
    }, {});

    const fieldsByTypeName = Object.entries(resolveTree.fieldsByTypeName).reduce((f, [k, v]) => {
        const resolveTrees = Object.entries(v).reduce((t, [k1, v1]) => {
            return {
                ...t,
                [k1]: getNeo4jFieldsByTypeName(
                    v1,
                    fieldNode.selectionSet?.selections as FieldNode[],
                    resolveInfo.operation.variableDefinitions
                ),
            };
        }, {});

        return {
            ...f,
            [k]: resolveTrees,
        };
    }, {});

    const { alias, name } = resolveTree;

    return { alias, args, fieldsByTypeName, name } as ResolveTree;
}

export default getNeo4jResolveTree;
