import { GraphQLResolveInfo } from "graphql";
import { parseResolveInfo, ResolveTree } from "graphql-parse-resolve-info";
import { int } from "neo4j-driver";
import { NeoSchema, Node } from "../classes";
import { createWhereAndParams, createProjectionAndParams } from "../neo4j";
import { trimmer } from "../utils";

function cypherQuery(_, context: any, resolveInfo: GraphQLResolveInfo): [string, any] {
    const neoSchema: NeoSchema = context.neoSchema;

    if (!neoSchema || !(neoSchema instanceof NeoSchema)) {
        throw new Error("invalid schema");
    }

    const resolveTree = parseResolveInfo(resolveInfo) as ResolveTree;
    const query = resolveTree.args.query as any;
    const options = resolveTree.args.options as any;
    const fieldsByTypeName = resolveTree.fieldsByTypeName;
    const [operation, nodeName] = resolveTree.name.split("_");

    const node = neoSchema.nodes.find((x) => x.name === nodeName) as Node;
    const varName = "this";

    const matchStr = `MATCH (${varName}:${node.name})`;
    let whereStr = "";
    let skipStr = "";
    let limitStr = "";
    let sortStr = "";
    let projStr = "";
    let cypherParams: { [k: string]: any } = {};

    switch (operation) {
        case "FindOne":
            {
                if (query) {
                    const where = createWhereAndParams({
                        query,
                        varName,
                    });
                    whereStr = where[0];
                    cypherParams = { ...cypherParams, ...where[1] };
                }

                const projection = createProjectionAndParams({
                    node,
                    neoSchema,
                    fieldsByTypeName,
                    typeName: node.name,
                });
                projStr = projection[0];
                cypherParams = { ...cypherParams, ...projection[1] };

                limitStr = "LIMIT 1";
            }
            break;

        case "FindMany":
            {
                if (query) {
                    const where = createWhereAndParams({
                        query,
                        varName,
                    });
                    whereStr = where[0];
                    cypherParams = { ...cypherParams, ...where[1] };
                }

                const projection = createProjectionAndParams({
                    node,
                    neoSchema,
                    fieldsByTypeName,
                    typeName: node.name,
                });
                projStr = projection[0];
                cypherParams = { ...cypherParams, ...projection[1] };

                if (options) {
                    if (options.skip) {
                        skipStr = `SKIP $${varName}_skip`;
                        cypherParams[`${varName}_skip`] = int(options.skip);
                    }

                    if (options.limit) {
                        limitStr = `LIMIT $${varName}_limit`;
                        cypherParams[`${varName}_limit`] = int(options.limit);
                    }

                    if (options.sort && options.sort.length) {
                        const sortArr = options.sort.map((s) => {
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
            }
            break;

        default:
            throw new Error("Invalid query");
    }

    const cypher = `
        ${matchStr}
        ${whereStr}
        RETURN ${varName} ${projStr} as ${varName}
        ${sortStr || ""}
        ${skipStr || ""}
        ${limitStr || ""}
    `;

    if (neoSchema.options.debug) {
        // eslint-disable-next-line no-console
        let debug = console.log;

        if (typeof neoSchema.options.debug === "function") {
            debug = neoSchema.options.debug;
        }

        debug("=======CYPHER=======");
        debug(trimmer(cypher));
        debug("=======Params=======");
        debug(JSON.stringify(cypherParams, null, 2));
    }

    return [trimmer(cypher), cypherParams];
}

export default cypherQuery;
