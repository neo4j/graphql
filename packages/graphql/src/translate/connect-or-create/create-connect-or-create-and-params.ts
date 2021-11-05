import { RelationField, Context } from "../../types";
import { buildMergeStatement } from "./build-merge-statement";
import { CypherParams } from "../types";
import { Node } from "../../classes";
import { joinStatements } from "../../utils/utils";

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

    return [joinStatements(result.queries), result.params];
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
    const whereNodeParameters = input?.where?.node;
    const onCreateNode = input?.onCreate?.node;
    const [mergeNodeQuery, mergeNodeParams] = buildMergeStatement({
        node: {
            node: refNode,
            varName: baseName,
            parameters: whereNodeParameters,
            onCreate: onCreateNode,
        },
        context,
    });

    const onCreateEdge = input?.onCreate?.edge;
    const [mergeRelationQuery, mergeRelationParams] = buildMergeStatement({
        node: {
            varName: parentVar,
        },
        relation: {
            relationField,
            varName: baseName,
            onCreate: onCreateEdge,
        },
        context,
    });

    return [
        joinStatements([mergeNodeQuery, mergeRelationQuery]),
        {
            ...mergeNodeParams,
            ...mergeRelationParams,
        },
    ];
}
