import camelCase from "camelcase";
import { GraphQLResolveInfo } from "graphql";
import pluralize from "pluralize";
import { execute } from "../../utils";
import { translate } from "../../translate";
import { Node } from "../../classes";

export default function createResolver({ node }: { node: Node }) {
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

        return {
            [pluralize(camelCase(node.name))]: Object.values(result[0] || {}),
        };
    }

    return {
        type: `Create${pluralize(node.name)}MutationResponse!`,
        resolve,
        args: { input: `[${node.name}CreateInput!]!` },
    };
}
