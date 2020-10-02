import { GraphQLResolveInfo, ObjectTypeDefinitionNode } from "graphql";
import * as neo4j from "../neo4j";
import { cypherQuery } from "../api";
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

        const [cypher, params] = cypherQuery(args, context, resolveInfo);

        const result = await neo4j.execute({ cypher, params, driver, defaultAccessMode: "READ", neoSchema });

        const single = result.map((r) => r.this)[0];

        return single;
    }

    return {
        type: `${definition.name.value}`,
        resolve,
        args: { query: `${definition.name.value}Query` },
    };
}

export default findOne;
