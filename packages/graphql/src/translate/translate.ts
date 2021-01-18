import { GraphQLResolveInfo } from "graphql";
import { parseResolveInfo, ResolveTree } from "graphql-parse-resolve-info";
import pluralize from "pluralize";
import { Driver } from "neo4j-driver";
import { NeoSchema, Node, Context } from "../classes";
import createWhereAndParams from "./create-where-and-params";
import createProjectionAndParams from "./create-projection-and-params";
import createCreateAndParams from "./create-create-and-params";
import { GraphQLWhereArg, GraphQLOptionsArg, RelationField, AuthOperations } from "../types";
import { checkRoles } from "../auth";
import createAuthAndParams from "./create-auth-and-params";
import createUpdateAndParams from "./create-update-and-params";
import createConnectAndParams from "./create-connect-and-params";
import createDisconnectAndParams from "./create-disconnect-and-params";

function translateRead({
    resolveTree,
    node,
    context,
}: {
    resolveTree: ResolveTree;
    context: Context;
    node: Node;
}): [string, any] {
    const whereInput = resolveTree.args.where as GraphQLWhereArg;
    const optionsInput = resolveTree.args.options as GraphQLOptionsArg;
    const fieldsByTypeName = resolveTree.fieldsByTypeName;
    const varName = "this";

    const matchStr = `MATCH (${varName}:${node.name})`;
    let whereStr = "";
    let authStr = "";
    let skipStr = "";
    let limitStr = "";
    let sortStr = "";
    let projStr = "";
    let cypherParams: { [k: string]: any } = {};

    const projection = createProjectionAndParams({
        node,
        context,
        fieldsByTypeName,
        varName,
    });
    projStr = projection[0];
    cypherParams = { ...cypherParams, ...projection[1] };

    if (whereInput) {
        const where = createWhereAndParams({
            whereInput,
            varName,
            node,
            context,
        });
        whereStr = where[0];
        cypherParams = { ...cypherParams, ...where[1] };
    }

    if (node.auth) {
        const allowAndParams = createAuthAndParams({
            operation: "read",
            node,
            context,
            varName,
            type: "allow",
        });
        cypherParams = { ...cypherParams, ...allowAndParams[1] };
        authStr = allowAndParams[0];
    }

    if (optionsInput) {
        const hasSkip = Boolean(optionsInput.skip) || optionsInput.skip === 0;
        const hasLimit = Boolean(optionsInput.limit) || optionsInput.limit === 0;

        if (hasSkip) {
            skipStr = `SKIP $${varName}_skip`;
            cypherParams[`${varName}_skip`] = optionsInput.skip;
        }

        if (hasLimit) {
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
        authStr,
        ...(sortStr ? [`WITH ${varName}`, sortStr] : []),
        `RETURN ${varName} ${projStr} as ${varName}`,
        skipStr,
        limitStr,
    ];

    return [cypher.filter(Boolean).join("\n"), cypherParams];
}

function translateCreate({
    context,
    resolveTree,
    node,
}: {
    resolveTree: ResolveTree;
    context: Context;
    node: Node;
}): [string, any] {
    const fieldsByTypeName = resolveTree.fieldsByTypeName;

    const { createStrs, params } = (resolveTree.args.input as any[]).reduce(
        (res, input, index) => {
            const varName = `this${index}`;

            const create = [`CALL {`];

            const createAndParams = createCreateAndParams({
                input,
                node,
                context,
                varName,
                withVars: [varName],
            });
            create.push(`${createAndParams[0]}`);
            create.push(`RETURN ${varName}`);
            create.push(`}`);

            res.createStrs.push(create.join("\n"));
            res.params = { ...res.params, ...createAndParams[1] };

            return res;
        },
        { createStrs: [], params: {}, withVars: [] }
    ) as {
        createStrs: string[];
        params: any;
    };

    /* so projection params don't conflict with create params. We only need to call createProjectionAndParams once. */
    const projection = createProjectionAndParams({
        node,
        context,
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

function translateUpdate({
    resolveTree,
    node,
    context,
}: {
    resolveTree: ResolveTree;
    node: Node;
    context: Context;
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
    let allowStr = "";
    let updateStr = "";
    let connectStr = "";
    let disconnectStr = "";
    let createStr = "";
    let bindStr = "";
    let projStr = "";
    let cypherParams: { [k: string]: any } = {};

    if (whereInput) {
        const where = createWhereAndParams({
            whereInput,
            varName,
            node,
            context,
        });
        whereStr = where[0];
        cypherParams = { ...cypherParams, ...where[1] };
    }

    if (node.auth) {
        const allowAndParams = createAuthAndParams({
            operation: "update",
            node,
            context,
            varName,
            type: "allow",
        });
        cypherParams = { ...cypherParams, ...allowAndParams[1] };
        allowStr = allowAndParams[0];
    }

    if (updateInput) {
        const updateAndParams = createUpdateAndParams({
            context,
            node,
            updateInput,
            varName,
            parentVar: varName,
            withVars: [varName],
        });
        if (updateAndParams[0]) {
            if (node.auth) {
                const allowAndParams = createAuthAndParams({
                    operation: "update",
                    node,
                    context,
                    varName,
                    type: "allow",
                });
                cypherParams = { ...cypherParams, ...allowAndParams[1] };
                allowStr = allowAndParams[0];
            }
        }
        updateStr = updateAndParams[0];
        cypherParams = { ...cypherParams, ...updateAndParams[1] };
    }

    if (disconnectInput) {
        Object.entries(disconnectInput).forEach((entry) => {
            const relationField = node.relationFields.find((x) => x.fieldName === entry[0]) as RelationField;
            const refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;

            const disconnectAndParams = createDisconnectAndParams({
                context,
                parentVar: varName,
                refNode,
                relationField,
                value: entry[1],
                varName: `${varName}_disconnect_${entry[0]}`,
                withVars: [varName],
                parentNode: node,
            });
            disconnectStr = disconnectAndParams[0];
            cypherParams = { ...cypherParams, ...disconnectAndParams[1] };
        });
    }

    if (connectInput) {
        Object.entries(connectInput).forEach((entry) => {
            const relationField = node.relationFields.find((x) => x.fieldName === entry[0]) as RelationField;
            const refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;

            const connectAndParams = createConnectAndParams({
                context,
                parentVar: varName,
                refNode,
                relationField,
                value: entry[1],
                varName: `${varName}_connect_${entry[0]}`,
                withVars: [varName],
                parentNode: node,
            });
            connectStr = connectAndParams[0];
            cypherParams = { ...cypherParams, ...connectAndParams[1] };
        });
    }

    if (createInput) {
        Object.entries(createInput).forEach((entry) => {
            const relationField = node.relationFields.find((x) => x.fieldName === entry[0]) as RelationField;
            const refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
            const inStr = relationField.direction === "IN" ? "<-" : "-";
            const outStr = relationField.direction === "OUT" ? "->" : "-";
            const relTypeStr = `[:${relationField.type}]`;

            const creates = relationField.typeMeta.array ? entry[1] : [entry[1]];
            creates.forEach((create, index) => {
                const innerVarName = `${varName}_create_${entry[0]}${index}`;

                const createAndParams = createCreateAndParams({
                    context,
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

    if (node.auth) {
        const bindAndParams = createAuthAndParams({
            operation: "update",
            node,
            context,
            varName,
            type: "bind",
            chainStrOverRide: `${varName}_bind`,
        });
        cypherParams = { ...cypherParams, ...bindAndParams[1] };
        bindStr = `WITH ${varName}\n${bindAndParams[0]}`;
    }

    const projection = createProjectionAndParams({
        node,
        context,
        fieldsByTypeName,
        varName,
    });
    projStr = projection[0];
    cypherParams = { ...cypherParams, ...projection[1] };

    const cypher = [
        matchStr,
        whereStr,
        allowStr,
        updateStr,
        connectStr,
        disconnectStr,
        createStr,
        bindStr,
        `RETURN ${varName} ${projStr} AS ${varName}`,
    ];

    return [cypher.filter(Boolean).join("\n"), cypherParams];
}

function translateDelete({
    resolveTree,
    node,
    context,
}: {
    resolveTree: ResolveTree;
    node: Node;
    context: Context;
}): [string, any] {
    const whereInput = resolveTree.args.where as GraphQLWhereArg;
    const varName = "this";

    const matchStr = `MATCH (${varName}:${node.name})`;
    let whereStr = "";
    let authStr = "";
    let cypherParams: { [k: string]: any } = {};

    if (whereInput) {
        const where = createWhereAndParams({
            whereInput,
            varName,
            node,
            context,
        });
        whereStr = where[0];
        cypherParams = { ...cypherParams, ...where[1] };
    }

    if (node.auth) {
        const allowAndParams = createAuthAndParams({
            operation: "delete",
            node,
            context,
            varName,
            type: "allow",
        });
        cypherParams = { ...cypherParams, ...allowAndParams[1] };
        authStr = allowAndParams[0];
    }

    const cypher = [matchStr, whereStr, authStr, `DETACH DELETE ${varName}`];

    return [cypher.filter(Boolean).join("\n"), cypherParams];
}

function translate({
    context: graphQLContext,
    resolveInfo,
}: {
    context: { [k: string]: any } & { driver?: Driver };
    resolveInfo: GraphQLResolveInfo;
}): [string, any] {
    const neoSchema: NeoSchema = graphQLContext.neoSchema;
    if (!neoSchema || !(neoSchema instanceof NeoSchema)) {
        throw new Error("invalid schema");
    }

    const context = new Context({
        graphQLContext,
        neoSchema,
        driver: graphQLContext.driver as Driver,
    });

    const resolveTree = parseResolveInfo(resolveInfo) as ResolveTree;
    const operationType = resolveInfo.operation.operation;
    const operationName = resolveInfo.fieldName;

    let operation: AuthOperations = "read";
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

        node = context.neoSchema.nodes.find(
            (x) => x.name === pluralize.singular(resolveTree.name.split(operation)[1])
        ) as Node;
    } else {
        operation = "read";
        node = context.neoSchema.nodes.find((x) => x.name === pluralize.singular(resolveTree.name)) as Node;
    }

    if (node.auth) {
        checkRoles({ node, context, operation });
    }

    switch (operation) {
        case "create":
            return translateCreate({
                resolveTree,
                node,
                context,
            });

        case "update":
            return translateUpdate({
                resolveTree,
                node,
                context,
            });

        case "delete":
            return translateDelete({
                resolveTree,
                node,
                context,
            });

        default:
            return translateRead({
                resolveTree,
                node,
                context,
            });
    }
}

export default translate;
