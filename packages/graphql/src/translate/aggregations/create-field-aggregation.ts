import { ResolveTree } from "graphql-parse-resolve-info";
import { Node } from "../../classes";
import { Context, RelationField } from "../../types";
import { generateResultObject, getFieldType, AggregationType } from "./utils";

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

    const pathStr = generatePathString(nodeLabel, relationAggregationField, referenceNode);
    const fieldPathBase = `${node.name}${referenceNode.name}${relationAggregationField.fieldName}`;
    const aggregationField = field.fieldsByTypeName[`${fieldPathBase}AggregationResult`];

    let projectionStr = "{}";
    let nodeQuery: string | undefined;
    let edgeQuery: string | undefined;

    if (aggregationField.node) {
        const resultFieldName = `${fieldPathBase}AggregateSelection`;
        const nodeField = aggregationField.node.fieldsByTypeName[resultFieldName];
        nodeQuery = createNodeQuery(pathStr, nodeField);
    }

    if (aggregationField.edge) {
        const resultFieldName = `${fieldPathBase}EdgeAggregateSelection`;
        const edgeField = aggregationField.edge.fieldsByTypeName[resultFieldName];
        edgeQuery = createEdgeQuery(pathStr, edgeField);
    }

    projectionStr = generateResultObject({
        count: aggregationField.count ? createCountQuery(pathStr) : undefined,
        node: nodeQuery,
        edge: edgeQuery,
    });
    return projectionStr;
}

function generatePathString(nodeLabel: string, relationField: RelationField, referenceNode: Node): string {
    const inStr = relationField.direction === "IN" ? "<-" : "-";
    const outStr = relationField.direction === "OUT" ? "->" : "-";
    const nodeOutStr = `(${subQueryNodeAlias}${referenceNode.labelString})`;

    return `(${nodeLabel})${inStr}[${subQueryRelationAlias}:${relationField.type}]${outStr}${nodeOutStr}`;
}

function getReferenceNode(context: Context, relationField: RelationField): Node | undefined {
    return context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name);
}

function createNodeQuery(pathStr: string, fields: Record<string, ResolveTree>): string | undefined {
    if (!fields) return undefined;

    return generateResultObject(
        Object.entries(fields).reduce((acc, [fieldName, field]) => {
            const fieldType = getFieldType(field);
            if (fieldType) {
                acc[fieldName] = createNodeFieldSubQuery(pathStr, fieldName, fieldType, subQueryNodeAlias);
            }
            return acc;
        }, {} as Record<string, string>)
    );
}

function createEdgeQuery(pathStr: string, fields: Record<string, ResolveTree>): string | undefined {
    if (!fields) return undefined;

    return generateResultObject(
        Object.entries(fields).reduce((acc, [fieldName, field]) => {
            const fieldType = getFieldType(field);
            if (fieldType) {
                acc[fieldName] = createNodeFieldSubQuery(pathStr, fieldName, fieldType, subQueryRelationAlias);
            }
            return acc;
        }, {} as Record<string, string>)
    );
}

function createCountQuery(pathStr: string): string {
    return `head(apoc.cypher.runFirstColumn("MATCH ${pathStr} RETURN COUNT(${subQueryNodeAlias})", {this:this}))`;
}

function createNodeFieldSubQuery(pathStr: string, fieldName: string, type: AggregationType, targetAlias: string) {
    return `head(apoc.cypher.runFirstColumn("
            ${getAggregationQuery(pathStr, fieldName, type, targetAlias)}
        ", {this:this}))`;
}

function getAggregationQuery(pathStr: string, fieldName: string, type: AggregationType, targetAlias): string {
    switch (type) {
        case AggregationType.String:
        case AggregationType.Id:
            return generateStringAggregationQuery(pathStr, fieldName, targetAlias);
        case AggregationType.Int:
        case AggregationType.BigInt:
        case AggregationType.Float:
            return generateNumberAggregationQuery(pathStr, fieldName, targetAlias);
        default:
            return generateDefaultAggregationQuery(pathStr, fieldName, targetAlias);
    }
}

function generateStringAggregationQuery(pathStr: string, fieldName: string, targetAlias: string) {
    const fieldPath = `${targetAlias}.${fieldName}`;
    return `MATCH ${pathStr}
            WITH ${targetAlias} as ${targetAlias}
            ORDER BY size(${fieldPath}) DESC
            WITH collect(${fieldPath}) as list
            RETURN {longest: head(list), shortest: last(list)}`;
}

function generateNumberAggregationQuery(pathStr: string, fieldName: string, targetAlias: string) {
    const fieldPath = `${targetAlias}.${fieldName}`;
    return `MATCH ${pathStr}
            RETURN {min: MIN(${fieldPath}), max: MAX(${fieldPath}), average: AVG(${fieldPath})}`;
}

function generateDefaultAggregationQuery(pathStr: string, fieldName: string, targetAlias: string) {
    const fieldPath = `${targetAlias}.${fieldName}`;
    return `MATCH ${pathStr}
            RETURN {min: MIN(${fieldPath}), max: MAX(${fieldPath})}`;
}
