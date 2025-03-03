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

import type { DirectiveNode } from "graphql";
import { GraphQLID } from "graphql";
import type {
    Directive,
    InputTypeComposer,
    InputTypeComposerFieldConfigMapDefinition,
    SchemaComposer,
} from "graphql-compose";
import { DEPRECATED } from "../../constants";
import type { EntityAdapter } from "../../schema-model/entity/EntityAdapter";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationshipDeclarationAdapter } from "../../schema-model/relationship/model-adapters/RelationshipDeclarationAdapter";
import { isUnionEntity } from "../../translate/queryAST/utils/is-union-entity";
import type { Neo4jFeaturesSettings } from "../../types";
import { getWhereFieldsForAttributes } from "../get-where-fields";
import { withAggregateInputType, withConnectionAggregateInputType } from "./aggregate-types";
import { augmentWhereInputWithRelationshipFilters } from "./augment-where-input";
import { shouldAddDeprecatedFields } from "./utils";

function isEmptyObject(obj: Record<string, unknown>): boolean {
    return !Object.keys(obj).length;
}

export function withUniqueWhereInputType({
    concreteEntityAdapter,
    composer,
}: {
    concreteEntityAdapter: ConcreteEntityAdapter;
    composer: SchemaComposer;
}): InputTypeComposer {
    const uniqueWhereFields: InputTypeComposerFieldConfigMapDefinition = {};

    const uniqueWhereInputType = composer.createInputTC({
        name: concreteEntityAdapter.operations.uniqueWhereInputTypeName,
        fields: uniqueWhereFields,
    });
    return uniqueWhereInputType;
}

export function addLogicalOperatorsToWhereInputType(type: InputTypeComposer): void {
    type.addFields({
        OR: type.NonNull.List,
        AND: type.NonNull.List,
        NOT: type,
    });
}

export function withWhereInputType({
    entityAdapter,
    userDefinedFieldDirectives,
    features,
    composer,
    typeName = entityAdapter.operations.whereInputTypeName,
    returnUndefinedIfEmpty = false,
    alwaysAllowNesting,
    ignoreCypherFieldFilters = false,
}: {
    entityAdapter: EntityAdapter | RelationshipAdapter;
    typeName?: string;
    userDefinedFieldDirectives?: Map<string, DirectiveNode[]>;
    features: Neo4jFeaturesSettings | undefined;
    composer: SchemaComposer;
    interfaceOnTypeName?: string;
    returnUndefinedIfEmpty?: boolean;
    alwaysAllowNesting?: boolean;
    ignoreCypherFieldFilters?: boolean;
}): InputTypeComposer | undefined {
    if (composer.has(typeName)) {
        return composer.getITC(typeName);
    }

    const whereFields = makeWhereFields({
        entityAdapter,
        userDefinedFieldDirectives,
        features,
        ignoreCypherFieldFilters,
        composer,
    });

    if (returnUndefinedIfEmpty && isEmptyObject(whereFields)) {
        return undefined;
    }

    const whereInputType = composer.createInputTC({
        name: typeName,
        fields: whereFields,
    });

    const allowNesting = alwaysAllowNesting || !isUnionEntity(entityAdapter);

    if (allowNesting) {
        addLogicalOperatorsToWhereInputType(whereInputType);
    }

    if (entityAdapter instanceof ConcreteEntityAdapter && entityAdapter.isGlobalNode()) {
        whereInputType.addFields({ id: GraphQLID });
    }

    if (entityAdapter instanceof InterfaceEntityAdapter) {
        const enumValues = Object.fromEntries(
            entityAdapter.concreteEntities.map((concreteEntity) => [
                concreteEntity.name,
                { value: concreteEntity.name },
            ])
        );
        if (entityAdapter.concreteEntities.length > 0) {
            const interfaceImplementation = composer.createEnumTC({
                name: entityAdapter.operations.implementationEnumTypename,
                values: enumValues,
            });
            whereInputType.addFields({ typename: { type: interfaceImplementation.NonNull.List } });
        }
    }
    return whereInputType;
}

function makeWhereFields({
    entityAdapter,
    userDefinedFieldDirectives,
    features,
    ignoreCypherFieldFilters,
    composer,
}: {
    entityAdapter: EntityAdapter | RelationshipAdapter;
    userDefinedFieldDirectives?: Map<string, DirectiveNode[]>;
    features: Neo4jFeaturesSettings | undefined;
    ignoreCypherFieldFilters: boolean;
    composer: SchemaComposer;
}): InputTypeComposerFieldConfigMapDefinition {
    if (entityAdapter instanceof UnionEntityAdapter) {
        const fields: InputTypeComposerFieldConfigMapDefinition = {};
        for (const concreteEntity of entityAdapter.concreteEntities) {
            fields[concreteEntity.name] = concreteEntity.operations.whereInputTypeName;
        }
        return fields;
    }

    return getWhereFieldsForAttributes({
        attributes: entityAdapter.whereFields,
        userDefinedFieldDirectives,
        features,
        ignoreCypherFieldFilters,
        composer,
    });
}

export function withSourceWhereInputType({
    relationshipAdapter,
    composer,
    deprecatedDirectives,
    userDefinedDirectivesOnTargetFields,
    features,
}: {
    relationshipAdapter: RelationshipAdapter | RelationshipDeclarationAdapter;
    composer: SchemaComposer;
    deprecatedDirectives: Directive[];
    userDefinedDirectivesOnTargetFields: Map<string, DirectiveNode[]> | undefined;
    features: Neo4jFeaturesSettings | undefined;
}): void {
    const relationshipTarget = relationshipAdapter.target;
    const relationshipSource = relationshipAdapter.source;
    const whereInput = composer.getITC(relationshipSource.operations.whereInputTypeName);
    augmentWhereInputWithRelationshipFilters({
        whereInput,
        relationshipAdapter,
        deprecatedDirectives,
        composer,
        features,
    });

    // TODO: Current unions are not supported as relationship targets beyond the above fields
    if (relationshipTarget instanceof UnionEntityAdapter) {
        return;
    }

    if (relationshipAdapter.isFilterableByAggregate()) {
        withConnectionAggregateInputType({
            relationshipAdapter,
            entityAdapter: relationshipTarget,
            composer: composer,
            userDefinedDirectivesOnTargetFields,
            features,
        });
        if (shouldAddDeprecatedFields(features, "aggregationFiltersOutsideConnection")) {
            const whereAggregateInput = withAggregateInputType({
                relationshipAdapter,
                entityAdapter: relationshipTarget,
                composer: composer,
                userDefinedDirectivesOnTargetFields,
                features,
            });

            whereInput.addFields({
                [relationshipAdapter.operations.aggregateFieldName]: {
                    type: whereAggregateInput,
                    directives: deprecatedDirectives.length
                        ? deprecatedDirectives
                        : [
                              {
                                  name: DEPRECATED,
                                  args: {
                                      reason: `Aggregate filters are moved inside the ${relationshipAdapter.operations.connectionFieldName} filter, please use { ${relationshipAdapter.operations.connectionFieldName}: { aggregate: {...} } } instead`,
                                  },
                              },
                          ],
                },
            });
        }
    }
}

export function withConnectWhereFieldInputType(
    relationshipTarget: ConcreteEntityAdapter | InterfaceEntityAdapter,
    composer: SchemaComposer
): InputTypeComposer {
    const connectWhereName = relationshipTarget.operations.connectWhereInputTypeName;
    if (composer.has(connectWhereName)) {
        return composer.getITC(connectWhereName);
    }
    const connectWhereType = composer.createInputTC({
        name: connectWhereName,
        fields: { node: `${relationshipTarget.operations.whereInputTypeName}!` },
    });

    return connectWhereType;
}
