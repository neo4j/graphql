/* eslint-disable @typescript-eslint/ban-ts-comment */
import { GraphQLResolveInfo, ObjectTypeDefinitionNode } from "graphql";
import * as neo4j from "../neo4j";
import { cypherQuery } from "../api";
import { NeoSchema, Node } from "../classes";

function findMany({ definition, getSchema }: { definition: ObjectTypeDefinitionNode; getSchema: () => NeoSchema }) {
    async function resolve(_: any, args: any, context: any, resolveInfo: GraphQLResolveInfo) {
        const neoSchema = getSchema();
        const node = neoSchema.nodes.find((x) => x.name === definition.name.value) as Node;

        // @ts-ignore
        // eslint-disable-next-line no-param-reassign
        context.neoSchema = neoSchema;

        const { driver } = context;

        if (!driver) {
            throw new Error("context.driver missing");
        }

        const [cypher, params] = cypherQuery(args, context, resolveInfo);

        const result = await neo4j.execute({ cypher, params, driver, defaultAccessMode: "READ" });

        const results = result.map((r) => r.this);

        function edger(value: any, _node?: Node) {
            return Object.entries(value).reduce((res, [k, v]: [string, any]) => {
                const relation = _node?.relationFields.find((x) => x.fieldName === k);

                if (relation) {
                    const relNode = neoSchema.nodes.find((x) => x.name === relation.typeMeta.name) as Node;

                    return {
                        ...res,
                        [k]: {
                            edges: v.map((x) => mapper(x, relNode)),
                            // pageInfo: {} TODO
                        },
                    };
                }

                return { ...res, [k]: v };
            }, {});
        }

        function mapper(r, _node: Node) {
            return { node: edger(r, _node) };
        }

        return {
            edges: results.map((x) => mapper(x, node)),
            // pageInfo: {} TODO
        };
    }

    return {
        type: `${definition.name.value}Connection`,
        resolve,
        args: { query: `${definition.name.value}Query`, options: `${definition.name.value}Options` },
    };
}

export default findMany;
