import { GraphQLResolveInfo } from "graphql";
import { execute } from "../../utils";
import { translate } from "../../translate";
import { Node } from "../../classes";

export default function deleteResolver({ node }: { node: Node }) {
    async function resolve(_root: any, _args: any, context: any, resolveInfo: GraphQLResolveInfo) {
        const [cypher, params] = translate({ context, resolveInfo });
        const result = await execute({
            cypher,
            params,
            driver: context.driver,
            defaultAccessMode: "WRITE",
            neoSchema: context.neoSchema,
            statistics: true,
            graphQLContext: context,
        });

        return result;
    }

    return {
        type: `DeleteInfo!`,
        resolve,
        args: {
            where: `${node.name}Where`,
            ...(node.relationFields.length
                ? {
                      delete: `${node.name}DeleteInput`,
                  }
                : {}),
        },
    };
}
