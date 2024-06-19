/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type {
    DefinitionNode,
    DocumentNode,
    EnumTypeDefinitionNode,
    FieldDefinitionNode,
    GraphQLDirective,
    GraphQLNamedType,
    InputValueDefinitionNode,
    InterfaceTypeDefinitionNode,
    ObjectTypeDefinitionNode,
    TypeNode,
    UnionTypeDefinitionNode,
} from "graphql";
import { GraphQLSchema, Kind, extendSchema, specifiedDirectives, validateSchema } from "graphql";
import { specifiedSDLRules } from "graphql/validation/specifiedRules";
import pluralize from "pluralize";
import * as directives from "../../graphql/directives";
import { typeDependantDirectivesScaffolds } from "../../graphql/directives/type-dependant-directives/scaffolds";
import { SortDirection } from "../../graphql/enums/SortDirection";
import { CartesianPointDistance } from "../../graphql/input-objects/CartesianPointDistance";
import { CartesianPointInput } from "../../graphql/input-objects/CartesianPointInput";
import { PointDistance } from "../../graphql/input-objects/PointDistance";
import { PointInput } from "../../graphql/input-objects/PointInput";
import { CartesianPoint } from "../../graphql/objects/CartesianPoint";
import { Point } from "../../graphql/objects/Point";
import * as scalars from "../../graphql/scalars";
import { directiveIsValid } from "../../schema/validation/custom-rules/directives/valid-directive";
import { ValidDirectiveAtFieldLocation } from "../../schema/validation/custom-rules/directives/valid-directive-field-location";
import { ValidRelationshipNtoN } from "../../schema/validation/custom-rules/features/valid-relationship-n-n";
import { ValidRelationshipProperties } from "../../schema/validation/custom-rules/features/valid-relationship-properties";
import { ReservedTypeNames } from "../../schema/validation/custom-rules/valid-types/reserved-type-names";
import { DirectiveCombinationValid } from "../../schema/validation/custom-rules/valid-types/valid-directive-combination";
import { WarnIfListOfListsFieldDefinition } from "../../schema/validation/custom-rules/warnings/list-of-lists";
import { validateSDL } from "../../schema/validation/validate-sdl";
import type { Neo4jFeaturesSettings } from "../../types";
import { isRootType } from "../../utils/is-root-type";

function filterDocument(document: DocumentNode): DocumentNode {
    const nodeNames = document.definitions
        .filter((definition) => {
            if (definition.kind === Kind.OBJECT_TYPE_DEFINITION) {
                if (!isRootType(definition)) {
                    return true;
                }
            }
            return false;
        })
        .map((definition) => (definition as ObjectTypeDefinitionNode).name.value);

    const getArgumentType = (type: TypeNode): string => {
        if (type.kind === Kind.LIST_TYPE) {
            return getArgumentType(type.type);
        }

        if (type.kind === Kind.NON_NULL_TYPE) {
            return getArgumentType(type.type);
        }

        return type.name.value;
    };

    const filterInputTypes = (
        fields: readonly InputValueDefinitionNode[] | undefined
    ): InputValueDefinitionNode[] | undefined => {
        return fields?.filter((f) => {
            const type = getArgumentType(f.type);

            const nodeMatch =
                /(?<nodeName>.+)(?:ConnectInput|ConnectWhere|CreateInput|DeleteInput|DisconnectInput|Options|RelationInput|Sort|UpdateInput|Where)/gm.exec(
                    type
                );
            if (nodeMatch?.groups?.nodeName) {
                if (nodeNames.includes(nodeMatch.groups.nodeName)) {
                    return false;
                }
            }

            return true;
        });
    };

    const filterFields = (fields: readonly FieldDefinitionNode[] | undefined): FieldDefinitionNode[] | undefined => {
        return fields
            ?.filter((field) => {
                const type = getArgumentType(field.type);
                const match = /(?:Create|Update)(?<nodeName>.+)MutationResponse/gm.exec(type);
                if (match?.groups?.nodeName) {
                    if (nodeNames.map((nodeName) => pluralize(nodeName)).includes(match.groups.nodeName)) {
                        return false;
                    }
                }
                return true;
            })
            .map((field) => {
                return {
                    ...field,
                    arguments: filterInputTypes(field.arguments),
                };
            });
    };

    const filteredDocument: DocumentNode = {
        ...document,
        definitions: document.definitions.reduce((res: DefinitionNode[], def) => {
            if (def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION) {
                const fields = filterInputTypes(def.fields);

                if (!fields?.length) {
                    return res;
                }

                return [
                    ...res,
                    {
                        ...def,
                        fields,
                    },
                ];
            }

            if (def.kind === Kind.OBJECT_TYPE_DEFINITION || def.kind === Kind.INTERFACE_TYPE_DEFINITION) {
                if (!def.fields?.length) {
                    return [...res, def];
                }

                const fields = filterFields(def.fields);
                if (!fields?.length) {
                    return res;
                }

                return [
                    ...res,
                    {
                        ...def,
                        fields,
                    },
                ];
            }

            return [...res, def];
        }, []),
    };

    return filteredDocument;
}

function runNeo4jGraphQLValidationRules({
    schema,
    document,
    extra,
    features,
}: {
    schema: GraphQLSchema;
    document: DocumentNode;
    extra: {
        enums?: EnumTypeDefinitionNode[];
        interfaces?: InterfaceTypeDefinitionNode[];
        unions?: UnionTypeDefinitionNode[];
        objects?: ObjectTypeDefinitionNode[];
    };
    features: Neo4jFeaturesSettings | undefined;
}) {
    const errors = validateSDL(
        document,
        [
            ...specifiedSDLRules,
            ValidRelationshipNtoN,
            directiveIsValid(extra),
            ValidDirectiveAtFieldLocation,
            DirectiveCombinationValid,
            ValidRelationshipProperties,
            ReservedTypeNames,
            WarnIfListOfListsFieldDefinition,
        ],
        schema
    );
    const filteredErrors = errors.filter((e) => e.message !== "Query root type must be provided.");
    if (filteredErrors.length) {
        throw filteredErrors;
    }
}

export function validateV6Document({
    document,
    features,
    additionalDefinitions,
}: {
    document: DocumentNode;
    features: Neo4jFeaturesSettings | undefined;
    additionalDefinitions: {
        additionalDirectives?: GraphQLDirective[];
        additionalTypes?: GraphQLNamedType[];
        enums?: EnumTypeDefinitionNode[];
        interfaces?: InterfaceTypeDefinitionNode[];
        unions?: UnionTypeDefinitionNode[];
        objects?: ObjectTypeDefinitionNode[];
    };
}): void {
    const filteredDocument = filterDocument(document);
    const { additionalDirectives, additionalTypes, ...extra } = additionalDefinitions;
    const schemaToExtend = new GraphQLSchema({
        directives: [
            ...Object.values(directives),
            ...typeDependantDirectivesScaffolds,
            ...specifiedDirectives,
            ...(additionalDirectives ?? []),
        ],
        types: [
            ...Object.values(scalars),
            Point,
            CartesianPoint,
            PointInput,
            PointDistance,
            CartesianPointInput,
            CartesianPointDistance,
            SortDirection,
            ...(additionalTypes || []),
        ],
    });

    runNeo4jGraphQLValidationRules({
        schema: schemaToExtend,
        document: filteredDocument,
        extra,
        features,
    });

    const schema = extendSchema(schemaToExtend, filteredDocument);

    const errors = validateSchema(schema);
    const filteredErrors = errors.filter((e) => e.message !== "Query root type must be provided.");
    if (filteredErrors.length) {
        throw filteredErrors;
    }
}
