import { SchemaComposer, upperFirst } from "graphql-compose";
import { Node } from "../../classes";
import { RelationField } from "../../types";

export function createConnectOrCreateField({
    node,
    rel,
    schemaComposer,
    hasNonGeneratedProperties,
    hasNonNullNonGeneratedProperties,
}: {
    node: Node;
    rel: RelationField;
    schemaComposer: SchemaComposer;
    hasNonGeneratedProperties: boolean;
    hasNonNullNonGeneratedProperties: boolean;
}): string | undefined {
    if (node.uniqueFields.length === 0) {
        return undefined;
    }
    const connectOrCreateName = `${rel.connectionPrefix}${upperFirst(rel.fieldName)}ConnectOrCreateFieldInput`;
    const connectOrCreate = rel.typeMeta.array ? `[${connectOrCreateName}!]` : connectOrCreateName;
    const connectOrCreateOnCreateName = `${connectOrCreateName}OnCreate`;
    schemaComposer.getOrCreateITC(connectOrCreateOnCreateName, (tc) => {
        tc.addFields({
            node: `${node.name}CreateInput!`,
            ...(hasNonGeneratedProperties
                ? { edge: `${rel.properties}CreateInput${hasNonNullNonGeneratedProperties ? `!` : ""}` }
                : {}),
        });
    });

    const connectOrCreateWhere = `${node.name}ConnectOrCreateWhere`;
    schemaComposer.getOrCreateITC(connectOrCreateWhere, (tc) => {
        tc.addFields({
            node: `${node.name}UniqueWhere!`,
        });
    });

    schemaComposer.getOrCreateITC(connectOrCreateName, (tc) => {
        tc.addFields({
            where: connectOrCreateWhere,
            onCreate: connectOrCreateOnCreateName,
        });
    });
    return connectOrCreate;
}
