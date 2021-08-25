import { Node, Relationship } from "../classes";

// For the @alias directive to be used
function mapToDbProperty(item: Node | Relationship, graphQLField: string): string {
    const itemProp = item.primitiveFields
        .concat(item.dateTimeFields, item.pointFields)
        .find(({ fieldName }) => fieldName === graphQLField);
    if (itemProp && itemProp.alias) {
        return itemProp.alias;
    }
    return graphQLField;
}

export default mapToDbProperty;
