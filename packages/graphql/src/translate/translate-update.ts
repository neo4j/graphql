import camelCase from "camelcase";
import pluralize from "pluralize";
import { Node } from "../classes";
import { Context, GraphQLWhereArg, RelationField } from "../types";
import createWhereAndParams from "./create-where-and-params";
import createProjectionAndParams from "./create-projection-and-params";
import createCreateAndParams from "./create-create-and-params";
import createAuthAndParams from "./create-auth-and-params";
import createUpdateAndParams from "./create-update-and-params";
import createConnectAndParams from "./create-connect-and-params";
import createDisconnectAndParams from "./create-disconnect-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import createDeleteAndParams from "./create-delete-and-params";

function translateUpdate({ node, context }: { node: Node; context: Context }): [string, any] {
    const { resolveTree } = context;
    const whereInput = resolveTree.args.where as GraphQLWhereArg;
    const updateInput = resolveTree.args.update;
    const connectInput = resolveTree.args.connect;
    const disconnectInput = resolveTree.args.disconnect;
    const createInput = resolveTree.args.create;
    const deleteInput = resolveTree.args.delete;
    const varName = "this";
    const matchStr = `MATCH (${varName}:${node.name})`;
    let whereStr = "";
    let updateStr = "";
    let connectStr = "";
    let disconnectStr = "";
    let createStr = "";
    let deleteStr = "";
    let projAuth = "";
    let projStr = "";
    let cypherParams: { [k: string]: any } = {};
    const whereStrs: string[] = [];
    const { fieldsByTypeName } = resolveTree.fieldsByTypeName[`Update${pluralize(node.name)}MutationResponse`][
        pluralize(camelCase(node.name))
    ];

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
        operation: "update",
        entity: node,
        context,
        where: { varName, node },
    });
    if (whereAuth[0]) {
        whereStrs.push(whereAuth[0]);
        cypherParams = { ...cypherParams, ...whereAuth[1] };
    }

    if (whereStrs.length) {
        whereStr = `WHERE ${whereStrs.join(" AND ")}`;
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
        [updateStr] = updateAndParams;
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
            [disconnectStr] = disconnectAndParams;
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
            [connectStr] = connectAndParams;
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
                [createStr] = createAndParams;
                cypherParams = { ...cypherParams, ...createAndParams[1] };
                createStr += `\nMERGE (${varName})${inStr}${relTypeStr}${outStr}(${innerVarName})`;
            });
        });
    }

    if (deleteInput) {
        const deleteAndParams = createDeleteAndParams({
            context,
            node,
            deleteInput,
            varName: `${varName}_delete`,
            parentVar: varName,
            withVars: [varName],
        });
        [deleteStr] = deleteAndParams;
        cypherParams = { ...cypherParams, ...deleteAndParams[1] };
    }

    const projection = createProjectionAndParams({
        node,
        context,
        fieldsByTypeName,
        varName,
    });
    [projStr] = projection;
    cypherParams = { ...cypherParams, ...projection[1] };
    if (projection[2]?.authValidateStrs?.length) {
        projAuth = `CALL apoc.util.validate(NOT(${projection[2].authValidateStrs.join(
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
        deleteStr,
        ...(projAuth ? [`WITH ${varName}`, projAuth] : []),
        `RETURN ${varName} ${projStr} AS ${varName}`,
    ];

    return [cypher.filter(Boolean).join("\n"), cypherParams];
}

export default translateUpdate;
