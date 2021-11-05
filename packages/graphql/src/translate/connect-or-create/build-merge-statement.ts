import { Context, RelationField } from "../../types";
import { Node } from "../../classes";
import { CypherParams } from "../types";

type TargetNode = {
    varName: string;
    node?: Node;
    parameters?: Record<string, any>;
    onCreate?: Record<string, any>;
};

export function buildMergeStatement({
    node,
    relation,
    context,
}: {
    node: TargetNode;
    relation?: TargetNode & { relationField: RelationField };
    context: Context;
}): [string, CypherParams] {
    const labels = node.node ? node.node.getLabelString(context) : "";
    const [parametersQuery, parameters] = parseNodeParameters(node.varName, node.parameters);
    let nodeQuery = `MERGE (${node.varName}${labels} ${parametersQuery})`;
    let onCreateParams = {};
    const onCreateQuery: string[] = [];

    if (relation) {
        const { relationField } = relation;
        const relationshipName = `${node.varName}_relationship_${relation.varName}`;
        const inStr = relationField.direction === "IN" ? "<-" : "-";
        const outStr = relationField.direction === "OUT" ? "->" : "-";
        const relTypeStr = `[${relationField.properties ? relationshipName : ""}:${relationField.type}]`;

        const relationQuery = `${inStr}${relTypeStr}${outStr}`;

        const relationTargetQuery = `(${relation.varName})`; // TODO: take node parameters into account

        nodeQuery = `${nodeQuery}${relationQuery}${relationTargetQuery}`;

        if (relation.onCreate) {
            const [onCreateRelationQuery, params] = buildOnCreate(relation.onCreate, relationshipName);
            onCreateQuery.push(onCreateRelationQuery);
            onCreateParams = { ...params, ...onCreateParams };
        }
    }

    if (node.onCreate) {
        const [onCreateNodeQuery, params] = buildOnCreate(node.onCreate, node.varName);
        onCreateQuery.push(onCreateNodeQuery);
        onCreateParams = { ...params, ...onCreateParams };
    }

    if (onCreateQuery.length > 0) {
        nodeQuery = `${nodeQuery}
        ON CREATE SET
        ${onCreateQuery.join("\n")}`;
    }

    return [nodeQuery, { ...parameters, ...onCreateParams }];
}

function parseNodeParameters(nodeVar: string, parameters: CypherParams | undefined): [string, CypherParams] {
    if (!parameters) return ["", {}];

    const cypherParameters = Object.entries(parameters).reduce((acc, [key, value]) => {
        const paramKey = transformKey(`${nodeVar}_where`, key);
        acc[paramKey] = value;
        return acc;
    }, {});

    const nodeParameters = Object.keys(parameters).reduce((acc, key) => {
        acc[key] = `$${transformKey(`${nodeVar}_where`, key)}`;
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
        queries.push(`${nodeVar}.${key} = $${transformKey(nodeVar, key)}`);
        parameters[transformKey(nodeVar, key)] = value;
    });
    return [queries.join(",\n"), parameters];
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
