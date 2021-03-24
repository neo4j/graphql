import camelCase from "camelcase";
import { GraphQLResolveInfo } from "graphql";
import pluralize from "pluralize";
import { execute } from "../../utils";
import { translate } from "../../translate";
import { Node } from "../../classes";

export default function updateResolver({ node }: { node: Node }) {
    async function resolve(_root: any, _args: any, context: any, resolveInfo: GraphQLResolveInfo) {
        const [cypher, params] = translate({ context, resolveInfo });
        const result = await execute({
            cypher,
            params,
            driver: context.driver,
            defaultAccessMode: "WRITE",
            neoSchema: context.neoSchema,
            graphQLContext: context,
        });

        return { [pluralize(camelCase(node.name))]: result.map((x) => x.this) };
    }

    return {
        type: `Update${pluralize(node.name)}MutationResponse!`,
        resolve,
        args: {
            where: `${node.name}Where`,
            update: `${node.name}UpdateInput`,
            ...(node.relationFields.length
                ? {
                      connect: `${node.name}ConnectInput`,
                      disconnect: `${node.name}DisconnectInput`,
                      create: `${node.name}RelationInput`,
                      delete: `${node.name}DeleteInput`,
                  }
                : {}),
        },
    };
}
