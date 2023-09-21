import type { DirectiveNode } from "graphql";
import type { Directive } from "graphql-compose";
import type { Subgraph } from "../../classes/Subgraph";
import { QueryOptions } from "../../graphql/input-objects/QueryOptions";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { getDirectedArgument2 } from "../directed-argument";
import { graphqlDirectivesToCompose } from "../to-compose";

export function augmentObjectOrInterfaceTypeWithRelationshipField(
    relationshipAdapter: RelationshipAdapter,
    userDefinedFieldDirectives: Map<string, DirectiveNode[]>,
    subgraph?: Subgraph | undefined
): Record<string, { type: string; description?: string; directives: Directive[]; args?: any }> {
    const fields = {};
    const relationshipField: { type: string; description?: string; directives: Directive[]; args?: any } = {
        type: relationshipAdapter.getTargetTypePrettyName(),
        description: relationshipAdapter.description,
        directives: graphqlDirectivesToCompose(userDefinedFieldDirectives.get(relationshipAdapter.name) || []),
    };

    let generateRelFieldArgs = true;

    // Subgraph schemas do not support arguments on relationship fields (singular)
    if (subgraph) {
        if (!relationshipAdapter.isList) {
            generateRelFieldArgs = false;
        }
    }

    if (generateRelFieldArgs) {
        // TODO: replace name reference with getType method
        const optionsTypeName =
            relationshipAdapter.target instanceof UnionEntityAdapter
                ? QueryOptions
                : relationshipAdapter.target.operations.optionsInputTypeName;
        const whereTypeName = relationshipAdapter.target.operations.whereInputTypeName;
        const nodeFieldsArgs = {
            where: whereTypeName,
            options: optionsTypeName,
        };
        const directedArg = getDirectedArgument2(relationshipAdapter);
        if (directedArg) {
            nodeFieldsArgs["directed"] = directedArg;
        }
        relationshipField.args = nodeFieldsArgs;
    }

    if (relationshipAdapter.isReadable()) {
        fields[relationshipAdapter.name] = relationshipField;
    }
    return fields;
}
