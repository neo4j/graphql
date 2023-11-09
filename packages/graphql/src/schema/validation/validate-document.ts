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

import { GraphQLSchema, extendSchema, validateSchema, specifiedDirectives, Kind } from "graphql";
import type {
    DefinitionNode,
    DocumentNode,
    ObjectTypeDefinitionNode,
    InputValueDefinitionNode,
    FieldDefinitionNode,
    TypeNode,
    GraphQLDirective,
    GraphQLNamedType,
    EnumTypeDefinitionNode,
    InterfaceTypeDefinitionNode,
    UnionTypeDefinitionNode,
} from "graphql";
import pluralize from "pluralize";
import * as scalars from "../../graphql/scalars";
import * as directives from "../../graphql/directives";
import { SortDirection } from "../../graphql/enums/SortDirection";
import { Point } from "../../graphql/objects/Point";
import { CartesianPoint } from "../../graphql/objects/CartesianPoint";
import { PointInput } from "../../graphql/input-objects/PointInput";
import { CartesianPointInput } from "../../graphql/input-objects/CartesianPointInput";
import { PointDistance } from "../../graphql/input-objects/PointDistance";
import { CartesianPointDistance } from "../../graphql/input-objects/CartesianPointDistance";
import { isRootType } from "../../utils/is-root-type";
import { validateSchemaCustomizations } from "./validate-schema-customizations";
import type { Neo4jFeaturesSettings } from "../../types";
import { validateSDL } from "./validate-sdl";
import { specifiedSDLRules } from "graphql/validation/specifiedRules";
import { DirectiveArgumentOfCorrectType } from "./custom-rules/directive-argument-of-correct-type";
import {
    DirectiveCombinationValid,
    SchemaOrTypeDirectives,
} from "./custom-rules/valid-types/valid-directive-combination";
import { ValidJwtDirectives } from "./custom-rules/features/valid-jwt-directives";
import { ValidFieldTypes } from "./custom-rules/valid-types/valid-field-types";
import { ReservedTypeNames } from "./custom-rules/valid-types/reserved-type-names";
import { ValidRelayID } from "./custom-rules/features/valid-relay-id";
import { ValidObjectType } from "./custom-rules/valid-types/valid-object-type";
import { ValidDirectiveInheritance } from "./custom-rules/valid-types/directive-multiple-inheritance";
import { directiveIsValid } from "./custom-rules/directives/valid-directive";
import { ValidRelationshipProperties } from "./custom-rules/features/valid-relationship-properties";
import { typeDependantDirectivesScaffolds } from "../../graphql/directives/type-dependant-directives/scaffolds";
import { ValidDirectiveAtFieldLocation } from "./custom-rules/directives/valid-directive-field-location";
import { WarnIfAuthorizationFeatureDisabled } from "./custom-rules/warnings/authorization-feature-disabled";
import { WarnIfListOfListsFieldDefinition } from "./custom-rules/warnings/list-of-lists";
import { WarnIfAMaxLimitCanBeBypassedThroughInterface } from "./custom-rules/warnings/limit-max-can-be-bypassed";

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

function runValidationRulesOnFilteredDocument({
    schema,
    document,
    extra,
    features,
    experimental,
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
    experimental: boolean;
}) {
    const errors = validateSDL(
        document,
        [
            ...specifiedSDLRules,
            directiveIsValid(extra, features?.populatedBy?.callbacks),
            ValidDirectiveAtFieldLocation(experimental),
            DirectiveCombinationValid,
            SchemaOrTypeDirectives,
            ValidJwtDirectives,
            ValidRelayID,
            ValidRelationshipProperties,
            ValidFieldTypes,
            ReservedTypeNames,
            ValidObjectType,
            ValidDirectiveInheritance,
            DirectiveArgumentOfCorrectType(false),
            WarnIfAuthorizationFeatureDisabled(features?.authorization),
            WarnIfListOfListsFieldDefinition,
            WarnIfAMaxLimitCanBeBypassedThroughInterface(experimental),
        ],
        schema
    );
    const filteredErrors = errors.filter((e) => e.message !== "Query root type must be provided.");
    if (filteredErrors.length) {
        throw filteredErrors;
    }
}

function validateDocument({
    document,
    features,
    additionalDefinitions,
    experimental,
}: {
    document: DocumentNode;
    features: Neo4jFeaturesSettings | undefined;
    additionalDefinitions: {
        additionalDirectives?: Array<GraphQLDirective>;
        additionalTypes?: Array<GraphQLNamedType>;
        enums?: EnumTypeDefinitionNode[];
        interfaces?: InterfaceTypeDefinitionNode[];
        unions?: UnionTypeDefinitionNode[];
        objects?: ObjectTypeDefinitionNode[];
    };
    experimental: boolean;
}): void {
    const filteredDocument = filterDocument(document);
    const { additionalDirectives, additionalTypes, ...extra } = additionalDefinitions;
    const schemaToExtend = new GraphQLSchema({
        directives: [
            ...Object.values(directives),
            ...typeDependantDirectivesScaffolds,
            ...specifiedDirectives,
            ...(additionalDirectives || []),
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

    runValidationRulesOnFilteredDocument({
        schema: schemaToExtend,
        document: filteredDocument,
        extra,
        features,
        experimental,
    });

    const schema = extendSchema(schemaToExtend, filteredDocument);

    const errors = validateSchema(schema);
    const filteredErrors = errors.filter((e) => e.message !== "Query root type must be provided.");
    if (filteredErrors.length) {
        throw filteredErrors;
    }

    // TODO: how to improve this??
    // validates `@customResolver`
    validateSchemaCustomizations({ document, schema });
}

export default validateDocument;
