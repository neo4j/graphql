import { GraphQLResolveInfo } from "graphql";
import { execute } from "../utils";
import { translate } from "../translate";
import { NeoSchema, Node } from "../classes";

function find({ node, getSchema }: { node: Node; getSchema: () => NeoSchema }) {
    async function resolve(_root: any, _args: any, context: any, resolveInfo: GraphQLResolveInfo) {
        const neoSchema = getSchema();

        // @ts-ignore
        // eslint-disable-next-line no-param-reassign
        context.neoSchema = neoSchema;

        const { driver } = context;

        if (!driver) {
            throw new Error("context.driver missing");
        }

        const [cypher, params] = translate({ context, resolveInfo });

        const result = await execute({ cypher, params, driver, defaultAccessMode: "READ", neoSchema });

        return result.map((x) => x.this);
    }

    return {
        type: `[${node.name}]!`,
        resolve,
        args: { where: `${node.name}Where`, options: `${node.name}Options` },
    };
}

export default find;
