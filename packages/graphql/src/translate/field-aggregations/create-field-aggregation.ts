import { ResolveTree } from "graphql-parse-resolve-info";
import { Node } from "../../classes";
import { Context, RelationField } from "../../types";
import { generateResultObject, getFieldType, AggregationType, wrapApocRun, getReferenceNode } from "./utils";
import * as AggregationQueryGenerators from "./aggregation-sub-queries";

const subQueryNodeAlias = "n";
const subQueryRelationAlias = "r";

// eslint-disable-next-line import/prefer-default-export
export function createFieldAggregation({
    context,
    nodeLabel,
    node,
    field,
}: {
    context: Context;
    nodeLabel: string;
    node: Node;
    field: ResolveTree;
}): string | undefined {
    const relationAggregationField = node.relationFields.find((x) => {
        return `${x.fieldName}Aggregate` === field.name;
    });

    if (!relationAggregationField) return undefined;

    const referenceNode = getReferenceNode(context, relationAggregationField);
    if (!referenceNode) return undefined;

    const targetPattern = generateTargetPattern(nodeLabel, relationAggregationField, referenceNode);
    const fieldPathBase = `${node.name}${referenceNode.name}${relationAggregationField.fieldName}`;
    const aggregationField = field.fieldsByTypeName[`${fieldPathBase}AggregationResult`];

    const nodeField: Record<string, ResolveTree> | undefined =
        aggregationField.node?.fieldsByTypeName[`${fieldPathBase}AggregateSelection`];
    const edgeField: Record<string, ResolveTree> | undefined =
        aggregationField.edge?.fieldsByTypeName[`${fieldPathBase}EdgeAggregateSelection`];

    return generateResultObject({
        count: aggregationField.count ? createCountQuery(targetPattern, subQueryNodeAlias) : undefined,
        node: createAggregationQuery(targetPattern, nodeField, subQueryNodeAlias),
        edge: createAggregationQuery(targetPattern, edgeField, subQueryRelationAlias),
    });
}

function generateTargetPattern(nodeLabel: string, relationField: RelationField, referenceNode: Node): string {
    const inStr = relationField.direction === "IN" ? "<-" : "-";
    const outStr = relationField.direction === "OUT" ? "->" : "-";
    const nodeOutStr = `(${subQueryNodeAlias}${referenceNode.labelString})`;

    return `(${nodeLabel})${inStr}[${subQueryRelationAlias}:${relationField.type}]${outStr}${nodeOutStr}`;
}

function createCountQuery(targetPattern: string, targetAlias: string): string {
    return wrapApocRun(AggregationQueryGenerators.countQuery(targetPattern, targetAlias));
}

function createAggregationQuery(
    targetPattern: string,
    fields: Record<string, ResolveTree> | undefined,
    fieldAlias: string
): string | undefined {
    if (!fields) return undefined;

    return generateResultObject(
        Object.entries(fields).reduce((acc, [fieldName, field]) => {
            const fieldType = getFieldType(field);
            if (fieldType) {
                acc[fieldName] = wrapApocRun(getAggregationSubQuery(targetPattern, fieldName, fieldType, fieldAlias));
            }
            return acc;
        }, {} as Record<string, string>)
    );
}

function getAggregationSubQuery(
    targetPattern: string,
    fieldName: string,
    type: AggregationType,
    targetAlias: string
): string {
    switch (type) {
        case AggregationType.String:
        case AggregationType.Id:
            return AggregationQueryGenerators.stringAggregationQuery(targetPattern, fieldName, targetAlias);
        case AggregationType.Int:
        case AggregationType.BigInt:
        case AggregationType.Float:
            return AggregationQueryGenerators.numberAggregationQuery(targetPattern, fieldName, targetAlias);
        default:
            return AggregationQueryGenerators.defaultAggregationQuery(targetPattern, fieldName, targetAlias);
    }
}
