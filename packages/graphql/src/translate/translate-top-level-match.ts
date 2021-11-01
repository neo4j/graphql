import { dedent } from "graphql-compose";
import { Node } from "../classes";
import { AuthOperations, Context, GraphQLWhereArg } from "../types";
import createAuthAndParams from "./create-auth-and-params";
import createWhereAndParams from "./create-where-and-params";

function translateTopLevelMatch({
    node,
    context,
    varName,
    operation,
}: {
    context: Context;
    node: Node;
    varName: string;
    operation: AuthOperations;
}): [string, Record<string, unknown>] {
    let cyphers: string[] = [];
    let cypherParams = {};

    const { resolveTree } = context;
    const whereInput = resolveTree.args.where as GraphQLWhereArg;
    const searchInput = (resolveTree.args.search || {}) as Record<string, { phrase: string; score?: number }>;
    const labels = node.getLabelString(context);

    if (!Object.entries(searchInput).length) {
        cyphers.push(`MATCH (${varName}${labels})`);
    } else {
        if (Object.entries(searchInput).length > 1) {
            throw new Error("Can only call one search at any given time"); // TODO test me
        }

        const [indexName, indexInput] = Object.entries(searchInput)[0];
        const paramPhraseName = `${varName}_search_${indexName}_phrase`;
        cypherParams[paramPhraseName] = indexInput.phrase;

        cyphers.push(
            dedent(`
                CALL db.index.fulltext.queryNodes(
                    "${indexName}", 
                    $${paramPhraseName}
                ) YIELD node as this, score as score
            `)
        );
    }

    let whereStrs: string[] = [];

    if (whereInput) {
        const where = createWhereAndParams({
            whereInput,
            varName,
            node,
            context,
            recursing: true,
        });
        if (where[0]) {
            whereStrs.push(where[0]);
            cypherParams = { ...cypherParams, ...where[1] };
        }
    }

    const whereAuth = createAuthAndParams({
        operation,
        entity: node,
        context,
        where: { varName, node },
    });
    if (whereAuth[0]) {
        whereStrs.push(whereAuth[0]);
        cypherParams = { ...cypherParams, ...whereAuth[1] };
    }

    if (whereStrs.length) {
        cyphers.push(`WHERE ${whereStrs.join(" AND ")}`);
    }

    return [cyphers.join("\n"), cypherParams];
}

export default translateTopLevelMatch;
