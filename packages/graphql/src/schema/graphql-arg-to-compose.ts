import { InputValueDefinitionNode, ValueNode } from "graphql";
import getFieldTypeMeta from "./get-field-type-meta";
import parseValueNode from "./parse-value-node";

function graphqlArgsToCompose(args: InputValueDefinitionNode[]) {
    return args.reduce((res, arg) => {
        const meta = getFieldTypeMeta(arg);

        return {
            ...res,
            [arg.name.value]: {
                type: meta.pretty,
                description: arg.description,
                ...(arg.defaultValue ? { defaultValue: parseValueNode(arg.defaultValue as ValueNode) } : {}),
            },
        };
    }, {});
}

export default graphqlArgsToCompose;
