import { RelationField, Context } from "../../types";
import { buildMergeStatement } from "./build_merge_statement";
import { CypherParams } from "../types";
import { Node } from "../../classes";

type CreateOrConnectInput = Array<{
    where: {
        node: Record<string, any>;
    };
    onCreate: {
        node: Record<string, any>;
        edge: Record<string, any>;
    };
}>;

export function createConnectOrCreateAndParams({
    input,
    varName,
    parentVar,
    relationField,
    refNode,
    context,
}: {
    input: CreateOrConnectInput;
    varName: string;
    parentVar: string;
    relationField: RelationField;
    refNode: Node;
    context: Context;
}): [string, CypherParams] {
    const result = input.reduce(
        (acc, inputItem, index) => {
            const subqueryBaseName = `${varName}${index}`;

            const [query, params] = createConnectOrCreateSubQuery({
                input: inputItem,
                baseName: subqueryBaseName,
                parentVar,
                relationField,
                refNode,
                context,
            });

            acc.queries.push(query);
            return {
                queries: acc.queries,
                params: { ...params, ...acc.params },
            };
        },
        { queries: [] as string[], params: {} as Record<string, any> }
    );

    return [result.queries.join("\n"), result.params];
}

function createConnectOrCreateSubQuery({
    input,
    baseName,
    parentVar,
    relationField,
    refNode,
    context,
}: {
    input: CreateOrConnectInput[0];
    baseName: string;
    parentVar: string;
    relationField: RelationField;
    refNode: Node;
    context: Context;
}): [string, CypherParams] {
    // const nodeName = `${baseName}_node`;
    // const relationshipName = `${baseName}_relationship`;
    // const inStr = relationField.direction === "IN" ? "<-" : "-";
    // const outStr = relationField.direction === "OUT" ? "->" : "-";
    // const relTypeStr = `[${relationField.properties ? relationshipName : ""}:${relationField.type}]`;

    // const query = `MERGE (${parentVar})${inStr}${relTypeStr}${outStr}(${nodeName})`;

    const whereNodeParameters = input?.where?.node;
    const [mergeNodeQuery, mergeNodeParams] = buildMergeStatement({
        node: refNode,
        nodeVar: baseName,
        context,
        nodeParameters: whereNodeParameters,
    });

    // TODO: on create
    // const whereEdgeParameters = input?.where?.edge;
    const [mergeRelationQuery, mergeRelationParams] = buildMergeStatement({
        nodeVar: parentVar,
        context,
        relationField,
        relationTarget: baseName,
    });

    // TODO: on create 2

    return [
        `${mergeNodeQuery}
        ${mergeRelationQuery}
                `,
        {
            ...mergeNodeParams,
            ...mergeRelationParams,
        },
    ];
}

// const query = `
// MERGE (this0_movies0:Movie { isan: "0000-0000-03B6-0000-O-0000-0006-P" })`;

// if (input[0].onCreate) {
//     // ADD
//     // ON CREATE
//     // SET this0_movies0.title = "Forrest Gump"
//     // SET this0_movies0.isan = "0000-0000-03B6-0000-O-0000-0006-P"`;
// }
