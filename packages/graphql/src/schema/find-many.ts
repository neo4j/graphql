import { GraphQLResolveInfo, ObjectTypeDefinitionNode } from "graphql";
import { execute } from "../utils";
import { translate } from "../translate";
import { NeoSchema } from "../classes";

function findMany({ definition, getSchema }: { definition: ObjectTypeDefinitionNode; getSchema: () => NeoSchema }) {
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

        const result = await execute({ cypher, params, driver, defaultAccessMode: "READ", neoSchema });

        return result.map((x) => x.this);
    }

    return {
        type: `[${definition.name.value}]!`,
        resolve,
        args: { where: `${definition.name.value}Where`, options: `${definition.name.value}Options` },
    };
}

export default findMany;
