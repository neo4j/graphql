import camelCase from "camelcase";
import pluralize from "pluralize";
import { execute } from "../../utils";
import { translateCreate } from "../../translate";
import { Node } from "../../classes";
import { Context } from "../../types";

export default function createResolver({ node }: { node: Node }) {
    async function resolve(_root: any, _args: any, _context: unknown) {
        const context = _context as Context;
        const [cypher, params] = translateCreate({ context, node });

        const result = await execute({
            cypher,
            params,
            driver: context.driver,
            defaultAccessMode: "WRITE",
            neoSchema: context.neoSchema, // FIX ME
            context,
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
