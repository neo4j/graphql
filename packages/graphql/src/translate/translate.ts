import { GraphQLResolveInfo } from "graphql";
import { parseResolveInfo, ResolveTree } from "graphql-parse-resolve-info";
import pluralize from "pluralize";
import { NeoSchema, Node } from "../classes";
import createWhereAndParams from "./create-where-and-params";
import createProjectionAndParams from "./create-projection-and-params";
import { trimmer } from "../utils";
import { GraphQLWhereArg, GraphQLOptionsArg } from "../types";

function translate(_, context: any, resolveInfo: GraphQLResolveInfo): [string, any] {
    const neoSchema: NeoSchema = context.neoSchema;

    if (!neoSchema || !(neoSchema instanceof NeoSchema)) {
        throw new Error("invalid schema");
    }

    const resolveTree = parseResolveInfo(resolveInfo) as ResolveTree;
    const whereInput = resolveTree.args.where as GraphQLWhereArg;
    const optionsInput = resolveTree.args.options as GraphQLOptionsArg;
    const fieldsByTypeName = resolveTree.fieldsByTypeName;
    const node = neoSchema.nodes.find((x) => x.name === pluralize.singular(resolveTree.name)) as Node;
    const varName = "this";

    const matchStr = `MATCH (${varName}:${node.name})`;
    let whereStr = "";
    let skipStr = "";
    let limitStr = "";
    let sortStr = "";
    let projStr = "";
    let cypherParams: { [k: string]: any } = {};

    const projection = createProjectionAndParams({
        node,
        neoSchema,
        fieldsByTypeName,
        varName,
    });
    projStr = projection[0];
    cypherParams = { ...cypherParams, ...projection[1] };

    if (whereInput) {
        const where = createWhereAndParams({
            whereInput,
            varName,
        });
        whereStr = where[0];
        cypherParams = { ...cypherParams, ...where[1] };
    }

    if (optionsInput) {
        if (optionsInput.skip) {
            skipStr = `SKIP $${varName}_skip`;
            cypherParams[`${varName}_skip`] = optionsInput.skip;
        }

        if (optionsInput.limit) {
            limitStr = `LIMIT $${varName}_limit`;
            cypherParams[`${varName}_limit`] = optionsInput.limit;
        }

        if (optionsInput.sort && optionsInput.sort.length) {
            const sortArr = optionsInput.sort.map((s) => {
                let key;
                let direc;

                if (s.includes("_DESC")) {
                    direc = "DESC";
                    [key] = s.split("_DESC");
                } else {
                    direc = "ASC";
                    [key] = s.split("_ASC");
                }

                return `${varName}.${key} ${direc}`;
            });

            sortStr = `ORDER BY ${sortArr.join(", ")}`;
        }
    }

    const cypher = `
        ${matchStr}
        ${whereStr}
        RETURN ${varName} ${projStr} as ${varName}
        ${sortStr || ""}
        ${skipStr || ""}
        ${limitStr || ""}
    `;

    return [trimmer(cypher), cypherParams];
}

export default translate;
