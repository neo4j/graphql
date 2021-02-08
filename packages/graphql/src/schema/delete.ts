import { GraphQLResolveInfo } from "graphql";
import { execute } from "../utils";
import { translate } from "../translate";
import { NeoSchema, Node } from "../classes";

function deleteResolver({ node, getSchema }: { node: Node; getSchema: () => NeoSchema }) {
    async function resolve(_root: any, _args: any, context: any, resolveInfo: GraphQLResolveInfo) {
        const neoSchema = getSchema();
        context.neoSchema = neoSchema;
        if (neoSchema.options.context) {
            context = { ...context, ...neoSchema.options.context };
        }

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
            statistics: true,
        });

        return result;
    }

    return {
        type: `DeleteInfo!`,
        resolve,
        args: { where: `${node.name}Where`, delete: `${node.name}DeleteInput` },
    };
}

export default deleteResolver;
