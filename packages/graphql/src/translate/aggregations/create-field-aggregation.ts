import { ResolveTree } from "graphql-parse-resolve-info";
import { Node } from "../../classes";
import { Context, RelationField } from "../../types";

// eslint-disable-next-line import/prefer-default-export
export function createFieldAggregation(
    context: Context,
    nodeLabel: string,
    node: Node,
    field: ResolveTree
): string | undefined {
    const relationAggregationField = node.relationFields.find((x) => {
        return `${x.fieldName}Aggregate` === field.name;
    });

    if (!relationAggregationField) return undefined;

    const referenceNode = getReferenceNode(context, relationAggregationField);
    if (!referenceNode) return undefined;

    const pathStr = generatePathString(nodeLabel, relationAggregationField, referenceNode);

    const aggregationField =
        field.fieldsByTypeName[
            `${node.name}${referenceNode.name}${relationAggregationField.fieldName}AggregationResult`
        ];
    let projectionStr = "{}";
    let nodeQuery: string | undefined;

    if (aggregationField.node) {
        const resultFieldName = `${node.name}${referenceNode.name}${relationAggregationField.fieldName}AggregateSelection`;
        const nodeField = aggregationField.node.fieldsByTypeName[resultFieldName];
        nodeQuery = createNodeQuery(pathStr, nodeField);
    }

    // if (aggregationField.edge) {
    //     const resultFieldName = `${node.name}${referenceNode.name}${relationAggregationField.fieldName}EdgeAggregateSelection`;
    // }
    projectionStr = generateResultObject({
        count: aggregationField.count ? createCountQuery(pathStr) : undefined,
        node: nodeQuery,
    });
    return projectionStr;
}

function generatePathString(nodeLabel: string, relationField: RelationField, referenceNode: Node): string {
    const nodeMatchStr = `(${nodeLabel})`;
    const inStr = relationField.direction === "IN" ? "<-" : "-";
    const relTypeStr = `[:${relationField.type}]`;
    const outStr = relationField.direction === "OUT" ? "->" : "-";
    const labels = referenceNode?.labelString;
    const nodeOutStr = `(n${labels})`;

    return `${nodeMatchStr}${inStr}${relTypeStr}${outStr}${nodeOutStr}`;
}

function getReferenceNode(context: Context, relationField: RelationField): Node | undefined {
    return context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name);
}

function createNodeQuery(pathStr: string, field: Record<string, ResolveTree>): string | undefined {
    if (!field) return undefined;

    const aggregationNodeField = "name";
    return generateResultObject(
        Object.keys(field).reduce((acc, fieldName) => {
            acc[fieldName] = createNodeFieldSubQuery(pathStr, aggregationNodeField);
            return acc;
        }, {} as Record<string, string>)
    );
}

function createCountQuery(pathStr: string): string {
    return `head(apoc.cypher.runFirstColumn("MATCH ${pathStr} RETURN COUNT(n)", {this:this}))`;
}

function createNodeFieldSubQuery(pathStr: string, fieldName: string) {
    return `head(apoc.cypher.runFirstColumn("
            MATCH ${pathStr}
            WITH n as n
            ORDER BY size(n.${fieldName}) DESC
            WITH collect(n.${fieldName}) as list
            RETURN {longest: head(list), shortest: last(list)}
        ", {this:this}))`;
}

function generateResultObject(fields: Record<string, string | undefined>): string {
    return `{ ${Object.entries(fields)
        .map(([key, value]: [string, string | undefined]): string | undefined => {
            if (!value) return undefined;
            return `${key}: ${value}`;
        })
        .filter(Boolean)
        .join(", ")} }`;
}
