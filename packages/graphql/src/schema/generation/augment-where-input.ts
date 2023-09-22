import type { Directive, InputTypeComposerFieldConfigMapDefinition } from "graphql-compose";
import { DEPRECATED } from "../../constants";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";

function augmentWhereInputType({
    whereType,
    fieldName,
    filters,
    relationshipAdapter,
    deprecatedDirectives,
}: {
    whereType: string;
    fieldName: string;
    filters:
        | {
              type: string;
              description: string;
          }[]
        | undefined;
    relationshipAdapter: RelationshipAdapter;
    deprecatedDirectives: Directive[];
}): InputTypeComposerFieldConfigMapDefinition {
    const fields: InputTypeComposerFieldConfigMapDefinition = {};
    if (!relationshipAdapter.isFilterableByValue()) {
        return fields;
    }

    fields[fieldName] = {
        type: whereType,
    };
    fields[`${fieldName}_NOT`] = {
        type: whereType,
    };

    if (filters) {
        for (const filterField of filters) {
            fields[filterField.type] = {
                type: whereType,
                directives: deprecatedDirectives,
                // e.g. "Return Movies where all of the related Actors match this filter"
                description: filterField.description,
            };
            // TODO: are these deprecations still relevant?
            // only adding these for the deprecation message. If no deprecation anymore, delete them.
            fields[fieldName] = {
                type: whereType,
                directives: [
                    {
                        name: DEPRECATED,
                        args: { reason: `Use \`${fieldName}_SOME\` instead.` },
                    },
                ],
            };
            fields[`${fieldName}_NOT`] = {
                type: whereType,
                directives: [
                    {
                        name: DEPRECATED,
                        args: { reason: `Use \`${fieldName}_NONE\` instead.` },
                    },
                ],
            };
        }
    }

    return fields;
}

export function augmentWhereInputTypeWithRelationshipFields(
    relationshipAdapter: RelationshipAdapter,
    deprecatedDirectives: Directive[]
): InputTypeComposerFieldConfigMapDefinition {
    return augmentWhereInputType({
        whereType: relationshipAdapter.target.operations.whereInputTypeName,
        fieldName: relationshipAdapter.name,
        filters: relationshipAdapter.listFiltersModel?.filters,
        relationshipAdapter,
        deprecatedDirectives,
    });
}

export function augmentWhereInputTypeWithConnectionFields(
    relationshipAdapter: RelationshipAdapter,
    deprecatedDirectives: Directive[]
): InputTypeComposerFieldConfigMapDefinition {
    return augmentWhereInputType({
        whereType: relationshipAdapter.operations.connectionWhereInputTypename,
        fieldName: relationshipAdapter.operations.connectionFieldName,
        filters: relationshipAdapter.listFiltersModel?.connectionFilters,
        relationshipAdapter,
        deprecatedDirectives,
    });
}
