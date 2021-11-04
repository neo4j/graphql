import { Context, RelationField } from "../../types";
import { Node } from "../../classes";
import { CypherParams } from "../types";

type TargetNode = {
    varName: string;
    node?: Node;
    parameters?: Record<string, any>;
};

export function buildMergeStatement({
    node,
    relation,
    context,
    onCreate,
}: {
    node: TargetNode;
    relation?: TargetNode & { relationField: RelationField };
    context: Context;
    onCreate?: Record<string, any>;
}): [string, CypherParams] {
    const labels = node.node ? node.node.getLabelString(context) : "";
    const [parametersQuery, parameters] = parseNodeParameters(node.varName, node.parameters);
    let nodeQuery = `MERGE (${node.varName}${labels} ${parametersQuery})`;

    if (relation) {
        const { relationField } = relation;
        const relationshipName = `${node.varName}_relationship_${relation.varName}`;
        const inStr = relationField.direction === "IN" ? "<-" : "-";
        const outStr = relationField.direction === "OUT" ? "->" : "-";
        const relTypeStr = `[${relationField.properties ? relationshipName : ""}:${relationField.type}]`;

        const relationQuery = `${inStr}${relTypeStr}${outStr}`;

        const relationTargetQuery = `(${relation.varName})`; // TODO: take node parameters into account

        nodeQuery = `${nodeQuery}${relationQuery}${relationTargetQuery}`;
    }

    let onCreateParams = {};
    if (onCreate) {
        const [onCreateQuery, params] = buildOnCreate(onCreate, node.varName);
        nodeQuery = `${nodeQuery}
        ${onCreateQuery}`;

        onCreateParams = params;
    }

    return [nodeQuery, { ...parameters, ...onCreateParams }];
}

function parseNodeParameters(nodeVar: string, parameters: CypherParams | undefined): [string, CypherParams] {
    if (!parameters) return ["", {}];

    const cypherParameters = Object.entries(parameters).reduce((acc, [key, value]) => {
        const paramKey = transformKey(nodeVar, key);
        acc[paramKey] = value;
        return acc;
    }, {});

    const nodeParameters = Object.keys(parameters).reduce((acc, key) => {
        acc[key] = `$${transformKey(nodeVar, key)}`;
        return acc;
    }, {});

    return [serializeObject(nodeParameters), cypherParameters];
}

function transformKey(nodeVar: string, key: string): string {
    return `${nodeVar}_${key}`;
}

function buildOnCreate(onCreate: Record<string, any>, nodeVar: string): [string, CypherParams] {
    const queries: string[] = [];
    const parameters = {};

    Object.entries(onCreate).forEach(([key, value]) => {
        queries.push(`SET ${nodeVar}.${key} = $${transformKey(nodeVar, key)}`);
        parameters[transformKey(nodeVar, key)] = value;
    });
    return [queries.join("\n"), parameters];
}

// WARN: Dupe from apoc-run-utils.ts
function serializeObject(fields: Record<string, string | undefined | null>): string {
    return `{ ${Object.entries(fields)
        .map(([key, value]): string | undefined => {
            if (value === undefined || value === null || value === "") return undefined;
            return `${key}: ${value}`;
        })
        .filter(Boolean)
        .join(", ")} }`;
}
