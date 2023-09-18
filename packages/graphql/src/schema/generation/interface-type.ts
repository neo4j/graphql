import type { DirectiveNode } from "graphql";
import type { InterfaceTypeComposer, SchemaComposer } from "graphql-compose";
import { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import {
    attributeAdapterToComposeFields,
    graphqlDirectivesToCompose,
    relationshipAdapterToComposeFields,
} from "../to-compose";

export function withInterfaceType({
    entityAdapter,
    userDefinedFieldDirectives,
    userDefinedInterfaceDirectives,
    composer,
    config = {
        includeRelationships: false,
    },
}: {
    entityAdapter: InterfaceEntityAdapter | RelationshipAdapter; // required
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    userDefinedInterfaceDirectives: DirectiveNode[];
    composer: SchemaComposer;
    config?: {
        includeRelationships: boolean;
    };
}): InterfaceTypeComposer {
    // TODO: maybe create interfaceEntity.interfaceFields() method abstraction even if it retrieves all attributes?
    // can also take includeRelationships as argument
    const objectComposeFields = attributeAdapterToComposeFields(
        Array.from(entityAdapter.attributes.values()),
        userDefinedFieldDirectives
    );
    let fields = objectComposeFields;
    if (config.includeRelationships && entityAdapter instanceof InterfaceEntityAdapter) {
        fields = {
            ...fields,
            ...relationshipAdapterToComposeFields(
                Array.from(entityAdapter.relationships.values()),
                userDefinedFieldDirectives
            ),
        };
    }
    const interfaceTypeName =
        entityAdapter instanceof InterfaceEntityAdapter
            ? entityAdapter.name
            : (entityAdapter.propertiesTypeName as string); // this is checked one layer above in execution
    const composeInterface = composer.createInterfaceTC({
        name: interfaceTypeName,
        fields: fields,
        directives: graphqlDirectivesToCompose(userDefinedInterfaceDirectives),
    });
    return composeInterface;
}
