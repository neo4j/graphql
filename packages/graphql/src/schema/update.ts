import { GraphQLResolveInfo } from "graphql";
import { execute } from "../utils";
import { translate } from "../translate";
import { NeoSchema, Node } from "../classes";

function update({ node, getSchema }: { node: Node; getSchema: () => NeoSchema }) {
    async function resolve(_root: any, _args: any, context: any, resolveInfo: GraphQLResolveInfo) {
        const neoSchema = getSchema();
        context.neoSchema = neoSchema;

        const { driver } = context;
        if (!driver) {
            throw new Error("context.driver missing");
        }

        const [cypher, params] = translate({ context, resolveInfo });

        const result = await execute({
            cypher,
            params,
            driver,
            defaultAccessMode: "WRITE",
            neoSchema,
        });

        return Object.values((result[0] || {}) as any);
    }

    return {
        type: `[${node.name}]!`,
        resolve,
        args: {
            where: `${node.name}Where`,
            update: `${node.name}UpdateInput`,
            ...(node.relationFields.length
                ? {
                      connect: `${node.name}ConnectInput`,
                      disconnect: `${node.name}DisconnectInput`,
                  }
                : {}),
        },
    };
}

export default update;
