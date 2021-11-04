import { Context, RelationField } from "../../types";
import { Node } from "../../classes";
import { CypherParams } from "../types";

type TargetNode = {
    varName: string;
    node?: Node;
    parameters?: Record<string, any>;
};

export function buildMergeStatement({
    // node,
    node,
    relation,
    // nodeVar,
    context,
}: // nodeParameters,
{
    node: TargetNode;
    relation?: TargetNode & { relationField: RelationField };
    // node?: Node;
    // nodeVar: string;
    // nodeParameters?: Record<string, any>;
    context: Context;
}): [string, CypherParams] {
    const labels = node.node ? node.node.getLabelString(context) : "";
    const [parametersQuery, parameters] = parseNodeParameters(node.varName, node.parameters);
    const nodeQuery = `MERGE (${node.varName}${labels} ${parametersQuery})`;

    if (relation) {
        const { relationField } = relation;
        const relationshipName = `${node.varName}_relationship_${relation.varName}`;
        const inStr = relationField.direction === "IN" ? "<-" : "-";
        const outStr = relationField.direction === "OUT" ? "->" : "-";
        const relTypeStr = `[${relationField.properties ? relationshipName : ""}:${relationField.type}]`;

        const relationQuery = `${inStr}${relTypeStr}${outStr}`;

        const relationTargetQuery = `(${relation.varName})`;

        const mergeQuery = `${nodeQuery}${relationQuery}${relationTargetQuery}`;
        return [mergeQuery, {}];
    }
    return [nodeQuery, parameters];
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

// WARN: Dupe from apoc-run-utils.ts
export function serializeObject(fields: Record<string, string | undefined | null>): string {
    return `{ ${Object.entries(fields)
        .map(([key, value]): string | undefined => {
            if (value === undefined || value === null || value === "") return undefined;
            return `${key}: ${value}`;
        })
        .filter(Boolean)
        .join(", ")} }`;
}
