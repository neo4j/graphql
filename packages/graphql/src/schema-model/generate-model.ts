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
import getFieldTypeMeta from "../schema/get-field-type-meta";
import { filterTruthy } from "../utils/utils";
import { Neo4jGraphQLSchemaModel } from "./Neo4jGraphQLSchemaModel";
import type { Operations } from "./Neo4jGraphQLSchemaModel";
import type { Annotation } from "./annotation/Annotation";
import type { Attribute } from "./attribute/Attribute";
import { CompositeEntity } from "./entity/CompositeEntity";
import { ConcreteEntity } from "./entity/ConcreteEntity";
import { parseAuthorizationAnnotation } from "./parser/annotations-parser/authorization-annotation";
import { parseKeyAnnotation } from "./parser/annotations-parser/key-annotation";
import { parseArguments, findDirective } from "./parser/utils";
import type { RelationshipDirection } from "./relationship/Relationship";
import { Relationship } from "./relationship/Relationship";
import type { DefinitionCollection } from "./parser/definition-collection";
import { getDefinitionCollection } from "./parser/definition-collection";
import { parseAuthenticationAnnotation } from "./parser/annotations-parser/authentication-annotation";
import { Operation } from "./Operation";
import { parseSubscriptionsAuthorizationAnnotation } from "./parser/annotations-parser/subscriptions-authorization-annotation";
import { parseAttribute, parseField } from "./parser/parse-attribute";

export function generateModel(document: DocumentNode): Neo4jGraphQLSchemaModel {
    const definitionCollection: DefinitionCollection = getDefinitionCollection(document);

    const operations: Operations = definitionCollection.operations.reduce((acc, definition): Operations => {
        acc[definition.name.value] = generateOperation(definition);
        return acc;
    }, {});

    // hydrate interface to typeNames map
    hydrateInterfacesToTypeNamesMap(definitionCollection);

    const concreteEntities = Array.from(definitionCollection.nodes.values()).map((node) =>
        generateConcreteEntity(node, definitionCollection)
    );

    // TODO: this error could happen directly in getDefinitionCollection instead of here, as because we moved to Map structure it will never be the case that we have duplicate nodes.
    const concreteEntitiesMap = concreteEntities.reduce((acc, entity) => {
        if (acc.has(entity.name)) {
            throw new Neo4jGraphQLSchemaValidationError(`Duplicate node ${entity.name}`);
        }
        acc.set(entity.name, entity);
        return acc;
    }, new Map<string, ConcreteEntity>());

    const interfaceEntities = Array.from(definitionCollection.interfaceToImplementingTypeNamesMap.entries()).map(
        ([name, concreteEntities]) => {
            return generateCompositeEntity(name, concreteEntities, concreteEntitiesMap);
        }
    );
    const unionEntities = Array.from(definitionCollection.unionTypes).map(([unionName, unionDefinition]) => {
        return generateCompositeEntity(
            unionName,
            unionDefinition.types?.map((t) => t.name.value) || [],
            concreteEntitiesMap
        );
    });

    const annotations = createSchemaModelAnnotations(definitionCollection.schemaDirectives);

    const schema = new Neo4jGraphQLSchemaModel({
        compositeEntities: [...unionEntities, ...interfaceEntities],
        concreteEntities,
        operations,
        annotations,
    });
    definitionCollection.nodes.forEach((def) => hydrateRelationships(def, schema, definitionCollection));
    return schema;
}

function hydrateInterfacesToTypeNamesMap(definitionCollection: DefinitionCollection) {
    return definitionCollection.nodes.forEach((node) => {
        if (!node.interfaces) {
            return;
        }
        const objectTypeName = node.name.value;
        node.interfaces?.forEach((i) => {
            const interfaceTypeName = i.name.value;
            const concreteEntities = definitionCollection.interfaceToImplementingTypeNamesMap.get(interfaceTypeName);
            if (!concreteEntities) {
                throw new Neo4jGraphQLSchemaValidationError(
                    `Could not find composite entity with name ${interfaceTypeName}`
                );
            }
            // TODO: modify the existing array instead of creating a new one
            definitionCollection.interfaceToImplementingTypeNamesMap.set(
                interfaceTypeName,
                concreteEntities.concat(objectTypeName)
            );
        });
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

function hydrateRelationships(
    definition: ObjectTypeDefinitionNode,
    schema: Neo4jGraphQLSchemaModel,
    definitionCollection: DefinitionCollection
): void {
    const name = definition.name.value;
    const entity = schema.getEntity(name);

    if (!schema.isConcreteEntity(entity)) {
        throw new Error(`Cannot add relationship to non-concrete entity ${name}`);
    }
    const relationshipFields = (definition.fields || []).map((fieldDefinition) => {
        return generateRelationshipField(fieldDefinition, schema, entity, definitionCollection);
    });

    for (const relationship of filterTruthy(relationshipFields)) {
        entity.addRelationship(relationship);
    }
}

function generateRelationshipField(
    field: FieldDefinitionNode,
    schema: Neo4jGraphQLSchemaModel,
    source: ConcreteEntity,
    definitionCollection: DefinitionCollection
): Relationship | undefined {
    const fieldTypeMeta = getFieldTypeMeta(field.type);
    const relationshipDirective = findDirective(field.directives || [], "relationship");
    if (!relationshipDirective) return undefined;

    const fieldName = field.name.value;
    const relatedEntityName = fieldTypeMeta.name;
    const relatedToEntity = schema.getEntity(relatedEntityName);
    if (!relatedToEntity) throw new Error(`Entity ${relatedEntityName} Not Found`);

    const { type, direction, properties } = parseArguments(relationshipDirective);

    let attributes: Attribute[] = [];
    if (properties && typeof properties === "string") {
        const propertyInterface = definitionCollection.relationshipProperties.get(properties);
        if (!propertyInterface)
            throw new Error(
                `There is no matching interface defined with @relationshipProperties for properties "${properties}"`
            );

        const fields = (propertyInterface.fields || []).map((field) => parseAttribute(field, definitionCollection));

        attributes = filterTruthy(fields) as Attribute[];
    }
    return new Relationship({
        name: fieldName,
        type: type as string,
        attributes,
        source,
        target: relatedToEntity,
        direction: direction as RelationshipDirection,
    });
}

function generateConcreteEntity(
    definition: ObjectTypeDefinitionNode,
    definitionCollection: DefinitionCollection
): ConcreteEntity {
    const fields = (definition.fields || []).map((fieldDefinition) =>
        parseAttribute(fieldDefinition, definitionCollection)
    );

    const directives = (definition.directives || []).reduce((acc, directive) => {
        acc.set(directive.name.value, parseArguments(directive));
        return acc;
    }, new Map<string, Record<string, unknown>>());
    const labels = getLabels(definition, directives.get("node") || {});
    // TODO: add annotations inherited from interface

    return new ConcreteEntity({
        name: definition.name.value,
        labels,
        attributes: filterTruthy(fields) as Attribute[],
        annotations: createEntityAnnotations(definition.directives || []),
    });
}

function getLabels(definition: ObjectTypeDefinitionNode, nodeDirectiveArguments: Record<string, unknown>): string[] {
    if ((nodeDirectiveArguments.labels as string[] | undefined)?.length) {
        return nodeDirectiveArguments.labels as string[];
    }
    return [definition.name.value];
}

function createEntityAnnotations(directives: readonly DirectiveNode[]): Annotation[] {
    const entityAnnotations: Annotation[] = [];

    // We only ever want to create one annotation even when an entity contains several key directives
    const keyDirectives = directives.filter((directive) => directive.name.value === "key");
    if (keyDirectives) {
        entityAnnotations.push(parseKeyAnnotation(keyDirectives));
    }

    const annotations: Annotation[] = filterTruthy(
        directives.map((directive) => {
            switch (directive.name.value) {
                case "authorization":
                    return parseAuthorizationAnnotation(directive);
                case "authentication":
                    return parseAuthenticationAnnotation(directive);
                case "subscriptionsAuthorization":
                    return parseSubscriptionsAuthorizationAnnotation(directive);
                default:
                    return undefined;
            }
        })
    );

    return entityAnnotations.concat(annotations);
}

function createSchemaModelAnnotations(directives: readonly DirectiveNode[]): Annotation[] {
    const schemaModelAnnotations: Annotation[] = [];

    const annotations: Annotation[] = filterTruthy(
        directives.map((directive) => {
            switch (directive.name.value) {
                case "authentication":
                    return parseAuthenticationAnnotation(directive);
                default:
                    return undefined;
            }
        })
    );

    return schemaModelAnnotations.concat(annotations);
}

function generateOperation(definition: ObjectTypeDefinitionNode): Operation {
    const fields = (definition.fields || []).map((fieldDefinition) => parseField(fieldDefinition));

    return new Operation({
        name: definition.name.value,
        fields: filterTruthy(fields),
        annotations: createEntityAnnotations(definition.directives || []),
    });
}
