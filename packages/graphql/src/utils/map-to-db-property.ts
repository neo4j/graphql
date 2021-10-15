import { GraphElement } from "../classes/GraphElement";

// For the @alias directive to be used
function mapToDbProperty(item: GraphElement, graphQLField: string): string {
    const itemProp = item.primitiveFields
        .concat(item.temporalFields, item.pointFields)
        .find(({ fieldName }) => fieldName === graphQLField);
    return itemProp?.dbPropertyName || graphQLField;
}

export default mapToDbProperty;
