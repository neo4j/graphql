import type { AttributeAdapter } from "../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { FilterOperator } from "../../translate/queryAST/ast/filters/Filter";

export function getFilterOperator(attribute: AttributeAdapter, operator: string): FilterOperator | undefined {
    if (attribute.typeHelper.isString() || attribute.typeHelper.isID()) {
        return getStringOperator(operator);
    }
    if (attribute.typeHelper.isTemporal()) {
        return getNumberOperator(operator);
    }
    if (attribute.typeHelper.isNumeric()) {
        return getNumberOperator(operator);
    }
}

function getStringOperator(operator: string): FilterOperator | undefined {
    // TODO: avoid this mapping
    const stringOperatorMap = {
        equals: "EQ",
        in: "IN",
        matches: "MATCHES",
        contains: "CONTAINS",
        startsWith: "STARTS_WITH",
        endsWith: "ENDS_WITH",
    } as const;

    return stringOperatorMap[operator];
}

function getNumberOperator(operator: string): FilterOperator | undefined {
    // TODO: avoid this mapping
    const numberOperatorMap = {
        equals: "EQ",
        in: "IN",
        lt: "LT",
        lte: "LTE",
        gt: "GT",
        gte: "GTE",
    } as const;

    return numberOperatorMap[operator];
}
