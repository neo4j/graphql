import { GraphQLResolveInfo, ObjectTypeDefinitionNode } from "graphql";
import * as neo4j from "../neo4j";
import { cypherQuery } from "../api";
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

        const [cypher, params] = cypherQuery(args, context, resolveInfo);

        const result = await neo4j.execute({ cypher, params, driver, defaultAccessMode: "READ" });

        return result.map((x) => x.this);
    }

    return {
        type: `[${definition.name.value}]!`,
        resolve,
        args: { query: `${definition.name.value}Query`, options: `${definition.name.value}Options` },
    };
}

export default findMany;
