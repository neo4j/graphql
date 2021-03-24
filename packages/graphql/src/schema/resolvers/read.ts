import { GraphQLResolveInfo } from "graphql";
import { execute } from "../../utils";
import { translate } from "../../translate";
import { Node } from "../../classes";

export default function findResolver({ node }: { node: Node }) {
    async function resolve(_root: any, _args: any, context: any, resolveInfo: GraphQLResolveInfo) {
        const [cypher, params] = translate({ context, resolveInfo });
        const result = await execute({
            cypher,
            params,
            driver: context.driver,
            defaultAccessMode: "READ",
            neoSchema: context.neoSchema,
            graphQLContext: context,
        });

        return result.map((x) => x.this);
    }

    return {
        type: `[${node.name}]!`,
        resolve,
        args: { where: `${node.name}Where`, options: `${node.name}Options` },
    };
}
