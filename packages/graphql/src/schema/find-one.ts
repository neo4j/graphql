import { GraphQLResolveInfo, ObjectTypeDefinitionNode } from "graphql";
import { execute } from "../utils";
import { translate } from "../translate";
import { NeoSchema } from "../classes";

function findOne({ definition, getSchema }: { definition: ObjectTypeDefinitionNode; getSchema: () => NeoSchema }) {
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

        const single = result.map((r) => r.this)[0];

        return single;
    }

    return {
        type: `${definition.name.value}`,
        resolve,
        args: { where: `${definition.name.value}Where` },
    };
}

export default findOne;
