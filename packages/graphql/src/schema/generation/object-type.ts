import type { DirectiveNode } from "graphql";
import { GraphQLID, GraphQLNonNull } from "graphql";
import type { ObjectTypeComposer, SchemaComposer } from "graphql-compose";
import { InterfaceEntity } from "../../schema-model/entity/InterfaceEntity";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { attributeAdapterToComposeFields, graphqlDirectivesToCompose } from "../to-compose";

export function withObjectType({
    concreteEntityAdapter,
    userDefinedFieldDirectives,
    userDefinedObjectDirectives,
    composer,
}: {
    concreteEntityAdapter: ConcreteEntityAdapter;
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>;
    userDefinedObjectDirectives: DirectiveNode[];
    composer: SchemaComposer;
}): ObjectTypeComposer {
    const nodeFields = attributeAdapterToComposeFields(concreteEntityAdapter.objectFields, userDefinedFieldDirectives);
    const composeNode = composer.createObjectTC({
        name: concreteEntityAdapter.name,
        fields: nodeFields,
        description: concreteEntityAdapter.description,
        directives: graphqlDirectivesToCompose(userDefinedObjectDirectives),
        interfaces: concreteEntityAdapter.compositeEntities
            .filter((e) => e instanceof InterfaceEntity)
            .map((e) => e.name),
    });
    // TODO: maybe split this global node logic?
    if (concreteEntityAdapter.isGlobalNode()) {
        composeNode.setField("id", {
            type: new GraphQLNonNull(GraphQLID),
            resolve: (src) => {
                const field = concreteEntityAdapter.globalIdField.name;
                const value = src[field] as string | number;
                return concreteEntityAdapter.toGlobalId(value.toString());
            },
        });
        composeNode.addInterface("Node");
    }
    return composeNode;
}
