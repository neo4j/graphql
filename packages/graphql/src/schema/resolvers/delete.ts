import { execute } from "../../utils";
import { translateDelete } from "../../translate";
import { Context } from "../../types";
import { Node } from "../../classes";

export default function deleteResolver({ node }: { node: Node }) {
    async function resolve(_root: any, _args: any, _context: unknown) {
        const context = _context as Context;
        const [cypher, params] = translateDelete({ context, node });
        const result = await execute({
            cypher,
            params,
            driver: context.driver,
            defaultAccessMode: "WRITE",
            neoSchema: context.neoSchema,
            statistics: true,
            context,
        });

        return result;
    }

    return {
        type: `DeleteInfo!`,
        resolve,
        args: {
            where: `${node.name}Where`,
            ...(node.relationFields.length
                ? {
                      delete: `${node.name}DeleteInput`,
                  }
                : {}),
        },
    };
}
