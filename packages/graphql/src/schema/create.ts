import { GraphQLResolveInfo } from "graphql";
import { execute } from "../utils";
import { translate } from "../translate";
import { NeoSchema, Node } from "../classes";

function create({ node, getSchema }: { node: Node; getSchema: () => NeoSchema }) {
    async function resolve(_: any, args: any, context: any, resolveInfo: GraphQLResolveInfo) {
        const neoSchema = getSchema();

        // @ts-ignore
        // eslint-disable-next-line no-param-reassign
        context.neoSchema = neoSchema;

        const { driver } = context;

        if (!driver) {
            throw new Error("context.driver missing");
        }

        const [cypher, params] = translate(args, context, resolveInfo);

        const result = await execute({ cypher, params, driver, defaultAccessMode: "WRITE", neoSchema });

        return result.map((x) => x.this);
    }

    return {
        type: `[${node.name}]!`,
        resolve,
        args: { input: `[${node.name}CreateInput]!` },
    };
}

export default create;
