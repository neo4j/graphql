import { execute } from "../../utils";
import { translateRead } from "../../translate";
import { Node } from "../../classes";
import { Context } from "../../types";

export default function findResolver({ node }: { node: Node }) {
    async function resolve(_root: any, _args: any, _context: unknown) {
        const context = _context as Context;
        const [cypher, params] = translateRead({ context, node });

        const result = await execute({
            cypher,
            params,
            driver: context.driver,
            defaultAccessMode: "READ",
            neoSchema: context.neoSchema,
            context,
        });

        return result.map((x) => x.this);
    }

    return {
        type: `[${node.name}]!`,
        resolve,
        args: { where: `${node.name}Where`, options: `${node.name}Options` },
    };
}
