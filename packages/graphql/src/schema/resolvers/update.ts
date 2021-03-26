import camelCase from "camelcase";
import pluralize from "pluralize";
import { Node } from "../../classes";
import { Context } from "../../types";
import { translateUpdate } from "../../translate";
import { execute } from "../../utils";

export default function updateResolver({ node }: { node: Node }) {
    async function resolve(_root: any, _args: any, _context: unknown) {
        const context = _context as Context;
        const [cypher, params] = translateUpdate({ context, node });
        const result = await execute({
            cypher,
            params,
            driver: context.driver,
            defaultAccessMode: "WRITE",
            neoSchema: context.neoSchema,
            context,
        });

        return { [pluralize(camelCase(node.name))]: result.map((x) => x.this) };
    }

    return {
        type: `Update${pluralize(node.name)}MutationResponse!`,
        resolve,
        args: {
            where: `${node.name}Where`,
            update: `${node.name}UpdateInput`,
            ...(node.relationFields.length
                ? {
                      connect: `${node.name}ConnectInput`,
                      disconnect: `${node.name}DisconnectInput`,
                      create: `${node.name}RelationInput`,
                      delete: `${node.name}DeleteInput`,
                  }
                : {}),
        },
    };
}
