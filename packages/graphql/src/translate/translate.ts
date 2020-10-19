/* eslint-disable prefer-const */
import { GraphQLResolveInfo } from "graphql";
import { parseResolveInfo, ResolveTree } from "graphql-parse-resolve-info";
import pluralize from "pluralize";
import { NeoSchema, Node } from "../classes";
import createWhereAndParams from "./create-where-and-params";
import createProjectionAndParams from "./create-projection-and-params";
import createCreateAndParams from "./create-create-and-params";
import { trimmer } from "../utils";
import { GraphQLWhereArg, GraphQLOptionsArg } from "../types";

function translateRead(_, context: any, resolveInfo: GraphQLResolveInfo): [string, any] {
    const neoSchema: NeoSchema = context.neoSchema;

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

function translateCreate(_, context: any, resolveInfo: GraphQLResolveInfo): [string, any] {
    const neoSchema: NeoSchema = context.neoSchema;
    const resolveTree = parseResolveInfo(resolveInfo) as ResolveTree;
    const fieldsByTypeName = resolveTree.fieldsByTypeName;
    const node = neoSchema.nodes.find(
        (x) => x.name === pluralize.singular(resolveTree.name.split("create")[1])
    ) as Node;
    const withVars: string[] = [];

    const [createStrs, params, projStrs] = (resolveTree.args.input as any[]).reduce(
        (res: [string[], any, string[]], input, index) => {
            const varName = `this${index}`;
            withVars.push(varName);

            const createAndParams = createCreateAndParams({ input, node, neoSchema, varName, withVars });

            const withStr = withVars.length > 1 ? `WITH ${[...withVars].slice(0, withVars.length - 1).join(", ")}` : "";
            const cypher = `
                ${withStr}
                ${createAndParams[0]}
            `;

            const projection = createProjectionAndParams({
                node,
                neoSchema,
                fieldsByTypeName,
                varName,
            });

            return [
                [...res[0], cypher],
                { ...res[1], ...createAndParams[1], ...projection[1] },
                [...res[2], projection[0]],
            ];
        },
        [[], {}, []]
    ) as [string[], any, string[]];

    const cypher = `
    ${createStrs.join("\n")}
    RETURN ${createStrs.map((__, index) => `this${index} ${projStrs[index]} as this${index}`).join(", ")}
    `;

    return [cypher, { ...params }];
}

function translate(_, context: any, resolveInfo: GraphQLResolveInfo): [string, any] {
    const neoSchema: NeoSchema = context.neoSchema;

    if (!neoSchema || !(neoSchema instanceof NeoSchema)) {
        throw new Error("invalid schema");
    }

    const operationType = resolveInfo.operation.operation;
    const operationName = resolveInfo.fieldName;

    if (operationType === "mutation") {
        if (operationName.includes("create")) {
            return translateCreate(_, context, resolveInfo);
        }
    }

    return translateRead(_, context, resolveInfo);
}

export default translate;
