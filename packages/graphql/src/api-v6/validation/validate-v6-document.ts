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
    DocumentNode,
    EnumTypeDefinitionNode,
    GraphQLDirective,
    GraphQLNamedType,
    InterfaceTypeDefinitionNode,
    ObjectTypeDefinitionNode,
    UnionTypeDefinitionNode,
} from "graphql";
import { GraphQLSchema, extendSchema, specifiedDirectives, validateSchema } from "graphql";
import { specifiedSDLRules } from "graphql/validation/specifiedRules";
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
import { ValidRelationshipProperties } from "../../schema/validation/custom-rules/features/valid-relationship-properties";
import { ReservedTypeNames } from "../../schema/validation/custom-rules/valid-types/reserved-type-names";
import { DirectiveCombinationValid } from "../../schema/validation/custom-rules/valid-types/valid-directive-combination";
import { WarnIfListOfListsFieldDefinition } from "../../schema/validation/custom-rules/warnings/list-of-lists";
import { validateSDL } from "../../schema/validation/validate-sdl";
import type { Neo4jFeaturesSettings } from "../../types";
import { ValidLimit } from "./rules/valid-limit";
import { ValidRelationship } from "./rules/valid-relationship";

function runNeo4jGraphQLValidationRules({
    schema,
    document,
}: {
    schema: GraphQLSchema;
    document: DocumentNode;
    extra: {
        enums?: EnumTypeDefinitionNode[];
        interfaces?: InterfaceTypeDefinitionNode[];
        unions?: UnionTypeDefinitionNode[];
        objects?: ObjectTypeDefinitionNode[];
    };
}) {
    const errors = validateSDL(
        document,
        [
            ...specifiedSDLRules,
            ValidRelationship,
            ValidLimit,
            DirectiveCombinationValid,
            ValidRelationshipProperties,
            ReservedTypeNames,
            WarnIfListOfListsFieldDefinition,
        ],
        schema
    );
    if (errors.length) {
        throw errors;
    }
}

export function validateV6Document({
    document,
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
    const filteredDocument = document;
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
    });

    const schema = extendSchema(schemaToExtend, filteredDocument);

    const errors = validateSchema(schema);
    const filteredErrors = errors.filter((e) => e.message !== "Query root type must be provided.");
    if (filteredErrors.length) {
        throw filteredErrors;
    }
}
