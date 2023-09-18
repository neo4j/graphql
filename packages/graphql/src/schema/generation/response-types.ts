import type { DirectiveNode } from "graphql";
import { GraphQLNonNull } from "graphql";
import type { SchemaComposer } from "graphql-compose";
import { CreateInfo } from "../../graphql/objects/CreateInfo";
import { UpdateInfo } from "../../graphql/objects/UpdateInfo";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { graphqlDirectivesToCompose } from "../to-compose";

export function withMutationResponseTypes({
    concreteEntityAdapter,
    propagatedDirectives,
    composer,
}: {
    concreteEntityAdapter: ConcreteEntityAdapter;
    propagatedDirectives: DirectiveNode[];
    composer: SchemaComposer;
}): void {
    composer.createObjectTC({
        name: concreteEntityAdapter.operations.mutationResponseTypeNames.create,
        fields: {
            info: new GraphQLNonNull(CreateInfo),
            [concreteEntityAdapter.plural]: `[${concreteEntityAdapter.name}!]!`,
        },
        directives: graphqlDirectivesToCompose(propagatedDirectives),
    });

    composer.createObjectTC({
        name: concreteEntityAdapter.operations.mutationResponseTypeNames.update,
        fields: {
            info: new GraphQLNonNull(UpdateInfo),
            [concreteEntityAdapter.plural]: `[${concreteEntityAdapter.name}!]!`,
        },
        directives: graphqlDirectivesToCompose(propagatedDirectives),
    });
}
