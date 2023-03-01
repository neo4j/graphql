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
import type { DirectiveNode, DocumentNode, FieldDefinitionNode, ObjectTypeDefinitionNode } from "graphql";
import { Neo4jGraphQLSchemaValidationError } from "../classes";
import { SCALAR_TYPES } from "../constants";
import { getDefinitionNodes } from "../schema/get-definition-nodes";
import getFieldTypeMeta from "../schema/get-field-type-meta";
import { filterTruthy } from "../utils/utils";
import type { Annotation } from "./annotation/Annotation";
import { Attribute } from "./attribute/Attribute";
import { CompositeEntity } from "./entity/CompositeEntity";
import { ConcreteEntity } from "./entity/ConcreteEntity";
import { Neo4jGraphQLSchemaModel } from "./Neo4jGraphQLSchemaModel";
import { parseAuthorizationAnnotation } from "./parser/authorization-annotation";
import { parseCypherAnnotation } from "./parser/cypher-annotation";
import { parseArguments } from "./parser/utils";

export function generateModel(document: DocumentNode): Neo4jGraphQLSchemaModel {
    const definitionNodes = getDefinitionNodes(document);

    // init interface to typennames map
    const interfaceToImplementingTypeNamesMap = definitionNodes.interfaceTypes.reduce((acc, entity) => {
        const interfaceTypeName = entity.name.value;
        acc.set(interfaceTypeName, []);
        return acc;
    }, new Map<string, string[]>());

    // hydrate interface to typennames map
    definitionNodes.objectTypes.forEach((el) => {
        if (!el.interfaces) {
            return;
        }
        const objectTypeName = el.name.value;
        el.interfaces?.forEach((i) => {
            const interfaceTypeName = i.name.value;
            const before = interfaceToImplementingTypeNamesMap.get(interfaceTypeName);
            if (!before) {
                throw new Neo4jGraphQLSchemaValidationError(
                    `Could not find composite entity with name ${interfaceTypeName}`
                );
            }
            interfaceToImplementingTypeNamesMap.set(interfaceTypeName, before.concat(objectTypeName));
        });
    });

    const concreteEntities = definitionNodes.objectTypes.map(generateConcreteEntity);
    const concreteEntitiesMap = concreteEntities.reduce((acc, entity) => {
        if (acc.has(entity.name)) {
            throw new Neo4jGraphQLSchemaValidationError(`Duplicate node ${entity.name}`);
        }
        acc.set(entity.name, entity);
        return acc;
    }, new Map<string, ConcreteEntity>());

    const interfaceEntities = Array.from(interfaceToImplementingTypeNamesMap.entries()).map(
        ([name, concreteEntities]) => {
            return generateCompositeEntity(name, concreteEntities, concreteEntitiesMap);
        }
    );
    const unionEntities = definitionNodes.unionTypes.map((entity) => {
        return generateCompositeEntity(
            entity.name.value,
            entity.types?.map((t) => t.name.value) || [],
            concreteEntitiesMap
        );
    });

    return new Neo4jGraphQLSchemaModel({
        compositeEntities: [...unionEntities, ...interfaceEntities],
        concreteEntities,
    });
}

function generateCompositeEntity(
    entityDefinitionName: string,
    entityImplementingTypeNames: string[],
    concreteEntities: Map<string, ConcreteEntity>
): CompositeEntity {
    const compositeFields = entityImplementingTypeNames.map((type) => {
        const concreteEntity = concreteEntities.get(type);
        if (!concreteEntity) {
            throw new Neo4jGraphQLSchemaValidationError(`Could not find concrete entity with name ${type}`);
        }
        return concreteEntity;
    });

    if (!compositeFields.length) {
        throw new Neo4jGraphQLSchemaValidationError(
            `Composite entity ${entityDefinitionName} has no concrete entities`
        );
    }
    // TODO: add annotations
    return new CompositeEntity({
        name: entityDefinitionName,
        concreteEntities: compositeFields,
    });
}

function generateConcreteEntity(definition: ObjectTypeDefinitionNode): ConcreteEntity {
    const fields = (definition.fields || []).map((fieldDefinition) => generateField(fieldDefinition, definition));
    const directives = (definition.directives || []).reduce((acc, directive) => {
        acc.set(directive.name.value, parseArguments(directive));
        return acc;
    }, new Map<string, Record<string, unknown>>());
    const labels = getLabels(definition, directives.get("node") || {});
    // TODO: add inheritedAnnotations from interfaces

    return new ConcreteEntity({
        name: definition.name.value,
        labels,
        attributes: filterTruthy(fields),
        annotations: createEntityAnnotation(definition.directives || [], definition),
    });
}

function getLabels(definition: ObjectTypeDefinitionNode, nodeDirectiveArguments: Record<string, unknown>): string[] {
    if ((nodeDirectiveArguments.labels as string[] | undefined)?.length) {
        return nodeDirectiveArguments.labels as string[];
    }
    return [definition.name.value];
}

function generateField(field: FieldDefinitionNode, typeDefinition: ObjectTypeDefinitionNode): Attribute | undefined {
    const typeMeta = getFieldTypeMeta(field.type); // TODO: without originalType
    if (SCALAR_TYPES.includes(typeMeta.name)) {
        const annotations = createFieldAnnotations(field.directives || [], typeDefinition);
        return new Attribute({
            name: field.name.value,
            annotations,
        });
    }
}

function createFieldAnnotations(
    directives: readonly DirectiveNode[],
    typeDefinition: ObjectTypeDefinitionNode
): Annotation[] {
    return filterTruthy(
        directives.map((directive) => {
            switch (directive.name.value) {
                case "cypher":
                    return parseCypherAnnotation(directive);
                case "authorization":
                    return parseAuthorizationAnnotation(directive, typeDefinition);
                default:
                    return undefined;
            }
        })
    );
}

function createEntityAnnotation(
    directives: readonly DirectiveNode[],
    typeDefinition: ObjectTypeDefinitionNode
): Annotation[] {
    return filterTruthy(
        directives.map((directive) => {
            switch (directive.name.value) {
                case "authorization":
                    return parseAuthorizationAnnotation(directive, typeDefinition);
                default:
                    return undefined;
            }
        })
    );
}
