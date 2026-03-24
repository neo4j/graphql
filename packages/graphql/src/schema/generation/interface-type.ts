/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DirectiveNode } from "graphql";
import type { InterfaceTypeComposer, SchemaComposer } from "graphql-compose";
import type { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { attributeAdapterToComposeFields, graphqlDirectivesToCompose } from "../to-compose";

export function withInterfaceType({
    interfaceEntityAdapter,
    userDefinedFieldDirectives,
    userDefinedInterfaceDirectives,
    composer,
}: {
    interfaceEntityAdapter: InterfaceEntityAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    userDefinedInterfaceDirectives: DirectiveNode[];
    composer: SchemaComposer;
}): InterfaceTypeComposer {
    // TODO: maybe create interfaceEntity.interfaceFields() method abstraction even if it retrieves all attributes?
    // can also take includeRelationships as argument
    const objectComposeFields = attributeAdapterToComposeFields(
        Array.from(interfaceEntityAdapter.attributes.values()),
        userDefinedFieldDirectives
    );
    const interfaceTypeName = interfaceEntityAdapter.name;
    return composer.createInterfaceTC({
        name: interfaceTypeName,
        fields: objectComposeFields,
        directives: graphqlDirectivesToCompose(userDefinedInterfaceDirectives),
    });
}
