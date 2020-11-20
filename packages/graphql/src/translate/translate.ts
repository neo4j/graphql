import { GraphQLResolveInfo } from "graphql";
import { parseResolveInfo, ResolveTree } from "graphql-parse-resolve-info";
import pluralize from "pluralize";
import { NeoSchema, Node } from "../classes";
import createWhereAndParams from "./create-where-and-params";
import createProjectionAndParams from "./create-projection-and-params";
import createCreateAndParams from "./create-create-and-params";
import { GraphQLWhereArg, GraphQLOptionsArg, RelationField } from "../types";
import createUpdateAndParams from "./create-update-and-params";
import createConnectAndParams from "./create-connect-and-params";
import createDisconnectAndParams from "./create-disconnect-and-params";

function translateRead({
    neoSchema,
    resolveTree,
    node,
}: {
    neoSchema: NeoSchema;
    resolveTree: ResolveTree;
    context: any;
    node: Node;
}): [string, any] {
    const whereInput = resolveTree.args.where as GraphQLWhereArg;
    const optionsInput = resolveTree.args.options as GraphQLOptionsArg;
    const fieldsByTypeName = resolveTree.fieldsByTypeName;
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

    const cypher = [
        matchStr,
        whereStr,
        `RETURN ${varName} ${projStr} as ${varName}`,
        `${sortStr || ""}`,
        `${skipStr || ""}`,
        `${limitStr || ""}`,
    ];

    return [cypher.filter(Boolean).join("\n"), cypherParams];
}

function translateCreate({
    neoSchema,
    resolveTree,
    node,
}: {
    neoSchema: NeoSchema;
    resolveTree: ResolveTree;
    context: any;
    node: Node;
}): [string, any] {
    const fieldsByTypeName = resolveTree.fieldsByTypeName;

    const { createStrs, params } = (resolveTree.args.input as any[]).reduce(
        (res, input, index) => {
            const varName = `this${index}`;
            res.withVars.push(varName);

            const createAndParams = createCreateAndParams({
                input,
                node,
                neoSchema,
                varName,
                withVars: res.withVars,
            });
            const withStr =
                res.withVars.length > 1
                    ? `\nWITH ${[...res.withVars].slice(0, res.withVars.length - 1).join(", ")}`
                    : "";

            res.createStrs.push(`${withStr}\n${createAndParams[0]}`);
            res.params = { ...res.params, ...createAndParams[1] };

            return res;
        },
        { createStrs: [], params: {}, withVars: [] }
    ) as {
        createStrs: string[];
        params: any;
        withVars: string[];
    };

    /* so projection params don't conflict with create params. We only need to call createProjectionAndParams once. */
    const projection = createProjectionAndParams({
        node,
        neoSchema,
        fieldsByTypeName,
        varName: "REPLACE_ME",
    });
    const replacedProjectionParams = Object.entries(projection[1]).reduce((res, [key, value]) => {
        return { ...res, [key.replace("REPLACE_ME", "projection")]: value };
    }, {});
    const projectionStr = createStrs
        .map(
            (_, i) =>
                `\nthis${i} ${projection[0]
                    .replace(/\$REPLACE_ME/g, "$projection")
                    .replace(/REPLACE_ME/g, `this${i}`)} AS this${i}`
        )
        .join(", ");

    const cypher = [`${createStrs.join("\n")}`, `\nRETURN ${projectionStr}`];

    return [cypher.join("\n"), { ...params, ...replacedProjectionParams }];
}

function translateDelete({
    resolveTree,
    node,
}: {
    neoSchema: NeoSchema;
    resolveTree: ResolveTree;
    node: Node;
}): [string, any] {
    const whereInput = resolveTree.args.where as GraphQLWhereArg;
    const varName = "this";

    const matchStr = `MATCH (${varName}:${node.name})`;
    let whereStr = "";
    let cypherParams: { [k: string]: any } = {};

    if (whereInput) {
        const where = createWhereAndParams({
            whereInput,
            varName,
        });
        whereStr = where[0];
        cypherParams = { ...cypherParams, ...where[1] };
    }

    const cypher = [matchStr, whereStr, `DETACH DELETE ${varName}`];

    return [cypher.filter(Boolean).join("\n"), cypherParams];
}

function translateUpdate({
    resolveTree,
    node,
    neoSchema,
}: {
    neoSchema: NeoSchema;
    resolveTree: ResolveTree;
    node: Node;
}): [string, any] {
    const whereInput = resolveTree.args.where as GraphQLWhereArg;
    const updateInput = resolveTree.args.update;
    const connectInput = resolveTree.args.connect;
    const disconnectInput = resolveTree.args.disconnect;
    const createInput = resolveTree.args.create;
    const fieldsByTypeName = resolveTree.fieldsByTypeName;
    const varName = "this";

    const matchStr = `MATCH (${varName}:${node.name})`;
    let whereStr = "";
    let updateStr = "";
    let connectStr = "";
    let disconnectStr = "";
    let createStr = "";
    let projStr = "";
    let cypherParams: { [k: string]: any } = {};

    if (whereInput) {
        const where = createWhereAndParams({
            whereInput,
            varName,
        });
        whereStr = where[0];
        cypherParams = { ...cypherParams, ...where[1] };
    }

    if (updateInput) {
        const updateAndParams = createUpdateAndParams({
            neoSchema,
            node,
            updateInput,
            varName,
            parentVar: varName,
            withVars: [varName],
        });
        updateStr = updateAndParams[0];
        cypherParams = { ...cypherParams, ...updateAndParams[1] };
    }

    if (connectInput) {
        Object.entries(connectInput).forEach((entry) => {
            const relationField = node.relationFields.find((x) => x.fieldName === entry[0]) as RelationField;
            const refNode = neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;

            const connectAndParams = createConnectAndParams({
                neoSchema,
                parentVar: varName,
                refNode,
                relationField,
                value: entry[1],
                varName: `${varName}_connect_${entry[0]}`,
                withVars: [varName],
            });
            connectStr = connectAndParams[0];
            cypherParams = { ...cypherParams, ...connectAndParams[1] };
        });
    }

    if (disconnectInput) {
        Object.entries(disconnectInput).forEach((entry) => {
            const relationField = node.relationFields.find((x) => x.fieldName === entry[0]) as RelationField;
            const refNode = neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;

            const disconnectAndParams = createDisconnectAndParams({
                neoSchema,
                parentVar: varName,
                refNode,
                relationField,
                value: entry[1],
                varName: `${varName}_disconnect_${entry[0]}`,
                withVars: [varName],
            });
            disconnectStr = disconnectAndParams[0];
            cypherParams = { ...cypherParams, ...disconnectAndParams[1] };
        });
    }

    if (createInput) {
        Object.entries(createInput).forEach((entry) => {
            const relationField = node.relationFields.find((x) => x.fieldName === entry[0]) as RelationField;
            const refNode = neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
            const inStr = relationField.direction === "IN" ? "<-" : "-";
            const outStr = relationField.direction === "OUT" ? "->" : "-";
            const relTypeStr = `[:${relationField.type}]`;

            const creates = relationField.typeMeta.array ? entry[1] : [entry[1]];
            creates.forEach((create, index) => {
                const innerVarName = `${varName}_create_${entry[0]}${index}`;

                const createAndParams = createCreateAndParams({
                    neoSchema,
                    node: refNode,
                    input: create,
                    varName: innerVarName,
                    withVars: [varName, innerVarName],
                });
                createStr = createAndParams[0];
                cypherParams = { ...cypherParams, ...createAndParams[1] };
                createStr += `\nMERGE (${varName})${inStr}${relTypeStr}${outStr}(${innerVarName})`;
            });
        });
    }

    const projection = createProjectionAndParams({
        node,
        neoSchema,
        fieldsByTypeName,
        varName,
    });
    projStr = projection[0];
    cypherParams = { ...cypherParams, ...projection[1] };

    const cypher = [
        matchStr,
        whereStr,
        updateStr,
        connectStr,
        disconnectStr,
        createStr,
        `RETURN ${varName} ${projStr} AS ${varName}`,
    ];

    return [cypher.filter(Boolean).join("\n"), cypherParams];
}

function translate({ context, resolveInfo }: { context: any; resolveInfo: GraphQLResolveInfo }): [string, any] {
    const neoSchema: NeoSchema = context.neoSchema;
    if (!neoSchema || !(neoSchema instanceof NeoSchema)) {
        throw new Error("invalid schema");
    }

    const resolveTree = parseResolveInfo(resolveInfo) as ResolveTree;
    const operationType = resolveInfo.operation.operation;
    const operationName = resolveInfo.fieldName;
    let operation: "create" | "read" | "delete" | "update" = "read";
    let node: Node | undefined;

    if (operationType === "mutation") {
        if (operationName.includes("create")) {
            operation = "create";
        }

        if (operationName.includes("delete")) {
            operation = "delete";
        }

        if (operationName.includes("update")) {
            operation = "update";
        }

        node = neoSchema.nodes.find((x) => x.name === pluralize.singular(resolveTree.name.split(operation)[1])) as Node;
    } else {
        operation = "read";
        node = neoSchema.nodes.find((x) => x.name === pluralize.singular(resolveTree.name)) as Node;
    }

    switch (operation) {
        case "create":
            return translateCreate({
                resolveTree,
                neoSchema,
                context,
                node: node as Node,
            });

        case "update":
            return translateUpdate({
                resolveTree,
                neoSchema,
                node: node as Node,
            });

        case "delete":
            return translateDelete({
                resolveTree,
                neoSchema,
                node: node as Node,
            });

        default:
            return translateRead({
                resolveTree,
                neoSchema,
                context,
                node: node as Node,
            });
    }
}

export default translate;
