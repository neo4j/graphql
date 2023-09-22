import type { Directive, InputTypeComposerFieldConfigMapDefinition } from "graphql-compose";
import pluralize from "pluralize";
import { DEPRECATED } from "../../constants";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";

// TODO: refactor ALE
export function augmentWhereInputTypeWithRelationshipFields(
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter,
    relationshipAdapter: RelationshipAdapter,
    deprecatedDirectives: Directive[]
): InputTypeComposerFieldConfigMapDefinition {
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    if (relationshipAdapter.isFilterableByValue()) {
        fields[relationshipAdapter.name] = {
            type: relationshipAdapter.target.operations.whereInputTypeName,
        };
        fields[`${relationshipAdapter.name}_NOT`] = {
            type: relationshipAdapter.target.operations.whereInputTypeName,
        };
    }
    if (relationshipAdapter.isList && relationshipAdapter.isFilterableByValue()) {
        for (const filter of ["ALL", "NONE", "SINGLE", "SOME"] as const) {
            fields[`${relationshipAdapter.name}_${filter}`] = {
                type: relationshipAdapter.target.operations.whereInputTypeName,
                directives: deprecatedDirectives,
                // e.g. "Return Movies where all of the related Actors match this filter"
                description: `Return ${pluralize(entityAdapter.name)} where ${
                    filter !== "SINGLE" ? filter.toLowerCase() : "one"
                } of the related ${pluralize(relationshipAdapter.target.name)} match this filter`,
            };
            // TODO: are these deprecations still relevant?
            // only adding these for the deprecation message. If no deprecation anymore, delete them.
            fields[relationshipAdapter.name] = {
                type: relationshipAdapter.target.operations.whereInputTypeName,
                directives: [
                    {
                        name: DEPRECATED,
                        args: { reason: `Use \`${relationshipAdapter.name}_SOME\` instead.` },
                    },
                ],
            };
            fields[`${relationshipAdapter.name}_NOT`] = {
                type: relationshipAdapter.target.operations.whereInputTypeName,
                directives: [
                    {
                        name: DEPRECATED,
                        args: { reason: `Use \`${relationshipAdapter.name}_NONE\` instead.` },
                    },
                ],
            };
        }
    }
    return fields;
}
