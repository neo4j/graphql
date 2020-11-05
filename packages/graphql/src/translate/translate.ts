import { GraphQLResolveInfo } from "graphql";
import { parseResolveInfo, ResolveTree } from "graphql-parse-resolve-info";
import pluralize from "pluralize";
import { NeoSchema, Node, AuthRule } from "../classes";
import createWhereAndParams from "./create-where-and-params";
import createProjectionAndParams from "./create-projection-and-params";
import createCreateAndParams from "./create-create-and-params";
import { GraphQLWhereArg, GraphQLOptionsArg } from "../types";
import { getRoles, verifyAndDecodeToken } from "../auth";
import createAuthAndParams from "./create-auth-and-params";

function translateRead({
    neoSchema,
    resolveTree,
    node,
    rules,
    jwt,
}: {
    neoSchema: NeoSchema;
    resolveTree: ResolveTree;
    context: any;
    node: Node;
    rules: AuthRule[];
    jwt: any;
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

    const authAndParams = createAuthAndParams({
        rules: rules.filter((r) => r.allow),
        jwt,
        node,
        neoSchema,
        varName,
    });

    const cypher = [
        matchStr,
        whereStr,
        authAndParams[0],
        `RETURN ${varName} ${projStr} as ${varName}`,
        `${sortStr || ""}`,
        `${skipStr || ""}`,
        `${limitStr || ""}`,
    ];

    return [cypher.filter(Boolean).join("\n"), { ...cypherParams, ...authAndParams[1] }];
}

function translateCreate({
    neoSchema,
    resolveTree,
    node,
    jwt,
}: {
    neoSchema: NeoSchema;
    resolveTree: ResolveTree;
    context: any;
    node: Node;
    jwt: any;
}): [string, any] {
    const fieldsByTypeName = resolveTree.fieldsByTypeName;

    const { createStrs, params } = (resolveTree.args.input as any[]).reduce(
        (res, input, index) => {
            let cypher = "";
            const varName = `this${index}`;
            res.withVars.push(varName);

            const createAndParams = createCreateAndParams({
                input,
                node,
                neoSchema,
                varName,
                withVars: res.withVars,
                jwt,
            });
            const withStr =
                res.withVars.length > 1
                    ? `\nWITH ${[...res.withVars].slice(0, res.withVars.length - 1).join(", ")}`
                    : "";
            cypher += `${withStr}\n${createAndParams[0]}`;

            res.createStrs.push(cypher);
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
    rules,
    neoSchema,
    jwt,
}: {
    neoSchema: NeoSchema;
    resolveTree: ResolveTree;
    node: Node;
    rules: AuthRule[];
    jwt: any;
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

    const authAndParams = createAuthAndParams({
        rules: rules.filter((r) => r.allow),
        jwt,
        node,
        neoSchema,
        varName,
    });

    const cypher = [matchStr, whereStr, authAndParams[0], `DETACH DELETE ${varName}`];

    return [cypher.filter(Boolean).join("\n"), { ...cypherParams, ...authAndParams[1] }];
}

function translate({ context, resolveInfo }: { context: any; resolveInfo: GraphQLResolveInfo }): [string, any] {
    const neoSchema: NeoSchema = context.neoSchema;
    if (!neoSchema || !(neoSchema instanceof NeoSchema)) {
        throw new Error("invalid schema");
    }

    const resolveTree = parseResolveInfo(resolveInfo) as ResolveTree;
    const operationType = resolveInfo.operation.operation;
    const operationName = resolveInfo.fieldName;
    let operation: "create" | "read" | "delete";
    let node: Node | undefined;
    let jwt: any;
    let jwtRoles: string[];

    if (operationType === "mutation") {
        if (operationName.includes("create")) {
            operation = "create";
            node = neoSchema.nodes.find(
                (x) => x.name === pluralize.singular(resolveTree.name.split(operation)[1])
            ) as Node;
        }

        if (operationName.includes("delete")) {
            operation = "delete";
            node = neoSchema.nodes.find(
                (x) => x.name === pluralize.singular(resolveTree.name.split(operation)[1])
            ) as Node;
        }
    } else {
        operation = "read";
        node = neoSchema.nodes.find((x) => x.name === pluralize.singular(resolveTree.name)) as Node;
    }

    const realNode = node as Node;

    const checkRoles = (rules: AuthRule[]) => {
        rules.forEach((rule) => {
            if (!jwt) {
                jwt = verifyAndDecodeToken({ context });
            }

            if (rule.roles) {
                rule.roles.forEach((role) => {
                    if (!jwtRoles) {
                        jwtRoles = getRoles(jwt);
                    }

                    if (!jwtRoles.includes(role)) {
                        if (!rules.filter((x) => x.allow === "*").length) {
                            throw new Error("Forbidden");
                        }
                    }
                });
            }
        });
    };

    if (operationType === "mutation") {
        if (operationName.includes("create")) {
            if (realNode.auth) {
                const createRules = realNode.auth.rules.filter(
                    (x) => x.operations?.includes("create") && x.isAuthenticated !== false
                );
                checkRoles(createRules);
            }

            return translateCreate({
                resolveTree,
                neoSchema,
                context,
                node: node as Node,
                jwt,
            });
        }

        if (operationName.includes("delete")) {
            let deleteRules: AuthRule[] = [];
            if (realNode.auth) {
                deleteRules = realNode.auth.rules.filter(
                    (x) => x.operations?.includes("delete") && x.isAuthenticated !== false
                );
                checkRoles(deleteRules);
            }

            return translateDelete({
                resolveTree,
                neoSchema,
                node: node as Node,
                rules: deleteRules,
                jwt,
            });
        }
    }

    let readRules: AuthRule[] = [];
    if (realNode.auth) {
        readRules = realNode.auth.rules.filter((x) => x.operations?.includes("read") && x.isAuthenticated !== false);
        checkRoles(readRules);
    }

    return translateRead({
        resolveTree,
        neoSchema,
        context,
        node: node as Node,
        rules: readRules,
        jwt,
    });
}

export default translate;
