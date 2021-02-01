import camelCase from "camelcase";
import { GraphQLResolveInfo } from "graphql";
import pluralize from "pluralize";
import { execute } from "../utils";
import { translate } from "../translate";
import { NeoSchema, Node } from "../classes";

function create({ node, getSchema }: { node: Node; getSchema: () => NeoSchema }) {
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
        });

        return {
            [pluralize(camelCase(node.name))]: Object.values((result[0] || {}) as any),
        };
    }

    return {
        type: `Create${pluralize(node.name)}MutationResponse!`,
        resolve,
        args: { input: `[${node.name}CreateInput]!` },
    };
}

export default create;
