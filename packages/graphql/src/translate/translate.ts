import camelCase from "camelcase";
import { GraphQLResolveInfo } from "graphql";
import { parseResolveInfo, ResolveTree } from "graphql-parse-resolve-info";
import pluralize from "pluralize";
import { Driver } from "neo4j-driver";
import { NeoSchema, Node, Context } from "../classes";
import createWhereAndParams from "./create-where-and-params";
import createProjectionAndParams from "./create-projection-and-params";
import createCreateAndParams from "./create-create-and-params";
import { GraphQLWhereArg, GraphQLOptionsArg, RelationField, AuthOperations } from "../types";
import createAuthAndParams from "./create-auth-and-params";
import createUpdateAndParams from "./create-update-and-params";
import createConnectAndParams from "./create-connect-and-params";
import createDisconnectAndParams from "./create-disconnect-and-params";
import createAuthParam from "./create-auth-param";
import { AUTH_FORBIDDEN_ERROR } from "../constants";

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
    let projAuth = "";
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
    if (projection[2]?.authStrs.length) {
        projAuth = `CALL apoc.util.validate(NOT(${projection[2].authStrs.join(
            " AND "
        )}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
    }

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
            entity: node,
            context,
            allow: {
                parentNode: node,
                varName,
            },
        });
        if (allowAndParams[0]) {
            cypherParams = { ...cypherParams, ...allowAndParams[1] };
            authStr = `CALL apoc.util.validate(NOT(${allowAndParams[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
        }
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
        ...(projAuth ? [`WITH ${varName}`, projAuth] : []),
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
    const fieldsByTypeName =
        resolveTree.fieldsByTypeName[`Create${pluralize(node.name)}MutationResponse`][pluralize(camelCase(node.name))]
            .fieldsByTypeName;

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
    let projAuth = "";
    const projection = createProjectionAndParams({
        node,
        context,
        fieldsByTypeName,
        varName: "REPLACE_ME",
    });
    if (projection[2]?.authStrs.length) {
        projAuth = `CALL apoc.util.validate(NOT(${projection[2].authStrs.join(
            " AND "
        )}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
    }

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

    const authCalls = createStrs
        .map((_, i) => projAuth.replace(/\$REPLACE_ME/g, "$projection").replace(/REPLACE_ME/g, `this${i}`))
        .join("\n");

    const cypher = [`${createStrs.join("\n")}`, authCalls, `\nRETURN ${projectionStr}`];

    return [cypher.filter(Boolean).join("\n"), { ...params, ...replacedProjectionParams }];
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
    const varName = "this";
    const matchStr = `MATCH (${varName}:${node.name})`;
    let whereStr = "";
    let updateStr = "";
    let connectStr = "";
    let disconnectStr = "";
    let createStr = "";
    let projAuth = "";
    let projStr = "";
    let cypherParams: { [k: string]: any } = {};
    const fieldsByTypeName =
        resolveTree.fieldsByTypeName[`Update${pluralize(node.name)}MutationResponse`][pluralize(camelCase(node.name))]
            .fieldsByTypeName;

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

    if (updateInput) {
        const updateAndParams = createUpdateAndParams({
            context,
            node,
            updateInput,
            varName,
            parentVar: varName,
            withVars: [varName],
        });
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

    const projection = createProjectionAndParams({
        node,
        context,
        fieldsByTypeName,
        varName,
    });
    projStr = projection[0];
    cypherParams = { ...cypherParams, ...projection[1] };
    if (projection[2]?.authStrs.length) {
        projAuth = `CALL apoc.util.validate(NOT(${projection[2].authStrs.join(
            " AND "
        )}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
    }

    const cypher = [
        matchStr,
        whereStr,
        updateStr,
        connectStr,
        disconnectStr,
        createStr,
        ...(projAuth ? [`WITH ${varName}`, projAuth] : []),
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
    let preAuthStr = "";
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

    const preAuth = createAuthAndParams({
        operation: "delete",
        entity: node,
        context,
        allow: {
            parentNode: node,
            varName,
        },
    });
    if (preAuth[0]) {
        cypherParams = { ...cypherParams, ...preAuth[1] };
        preAuthStr = `WITH ${varName}\nCALL apoc.util.validate(NOT(${preAuth[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
    }

    const cypher = [matchStr, whereStr, preAuthStr, `DETACH DELETE ${varName}`];

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
        node = context.neoSchema.nodes.find((x) => camelCase(x.name) === pluralize.singular(resolveTree.name)) as Node;
    }

    let query = "";
    let params: any = {};

    switch (operation) {
        case "create":
            [query, params] = translateCreate({
                resolveTree,
                node,
                context,
            });
            break;

        case "update":
            [query, params] = translateUpdate({
                resolveTree,
                node,
                context,
            });
            break;

        case "delete":
            [query, params] = translateDelete({
                resolveTree,
                node,
                context,
            });
            break;

        default:
            [query, params] = translateRead({
                resolveTree,
                node,
                context,
            });
            break;
    }

    // Its really difficult to know when users are using the `auth` param. For Simplicity it better to do the check here
    if (query.includes("$auth.") || query.includes("auth: $auth") || query.includes("auth:$auth")) {
        params.auth = createAuthParam({ context });
    }

    return [query, params];
}

export default translate;
