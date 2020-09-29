import { GraphQLResolveInfo, ObjectValueNode, FieldNode, ArgumentNode } from "graphql";
import { NeoSchema, Node } from "../classes";
import {
    createWhereAndParams,
    createProjectionAndParams,
    createLimitAndParams,
    createSkipAndParams,
    createSortAndParams,
} from "../neo4j";
import { trimmer } from "../utils";

function cypherQuery(graphQLArgs: any, context: any, resolveInfo: GraphQLResolveInfo): [string, any] {
    // @ts-ignore
    const neoSchema: NeoSchema = context.neoSchema;

    if (!neoSchema || !(neoSchema instanceof NeoSchema)) {
        throw new Error("invalid schema");
    }

    const { fieldName } = resolveInfo;

    const [operation, nodeName] = fieldName.split("_");

    const node = neoSchema.nodes.find((x) => x.name === nodeName) as Node;

    const fieldNode = resolveInfo.fieldNodes.find((n) => n.name.value === fieldName) as FieldNode;

    let cypherParams: { [k: string]: any } = {};
    const matchStr = `MATCH (this:${node.name})`;
    let whereStr = "";
    let skipStr = "";
    let limitStr = "";
    let sortStr = "";
    let projStr = "";

    const astArgs = resolveInfo.fieldNodes.find((x) => x.name.value === resolveInfo.fieldName)
        ?.arguments as ArgumentNode[];

    const objectValue = astArgs.find((x) => x.name.value === "query")?.value as ObjectValueNode;

    switch (operation) {
        case "FindOne":
            {
                const where = createWhereAndParams({ objectValue, node, neoSchema, graphQLArgs, varName: `this` });
                whereStr = where[0];
                cypherParams = { ...cypherParams, ...where[1] };

                const projection = createProjectionAndParams({ node, neoSchema, fieldNode, graphQLArgs });
                projStr = projection[0];
                cypherParams = { ...cypherParams, ...projection[1] };

                limitStr = "LIMIT 1";
            }
            break;

        case "FindMany":
            {
                const where = createWhereAndParams({ objectValue, node, neoSchema, graphQLArgs, varName: `this` });
                whereStr = where[0];
                cypherParams = { ...cypherParams, ...where[1] };

                const projection = createProjectionAndParams({ node, neoSchema, fieldNode, graphQLArgs });
                projStr = projection[0];
                cypherParams = { ...cypherParams, ...projection[1] };

                const skip = createSkipAndParams({
                    astArgs,
                    graphQLArgs,
                });
                skipStr = skip[0];
                cypherParams = { ...cypherParams, ...skip[1] };

                const limit = createLimitAndParams({
                    astArgs,
                    graphQLArgs,
                });
                limitStr = limit[0];
                cypherParams = { ...cypherParams, ...limit[1] };

                const sort = createSortAndParams({
                    astArgs,
                    graphQLArgs,
                    varName: "this",
                });
                sortStr = sort[0];
                cypherParams = { ...cypherParams, ...sort[1] };
            }
            break;

        default:
            throw new Error("Invalid query");
    }

    const cypher = `
        ${matchStr}
        ${whereStr}
        RETURN this ${projStr} as this
        ${sortStr || ""}
        ${skipStr || ""}
        ${limitStr || ""}
    `;

    console.log("=======CYPHER=======");
    console.log(trimmer(cypher));
    console.log("=======Params=======");
    console.log(JSON.stringify(cypherParams, null, 2));

    return [trimmer(cypher), cypherParams];
}

export default cypherQuery;
