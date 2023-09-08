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
    DirectiveNode,
    DocumentNode,
    FieldDefinitionNode,
    InterfaceTypeDefinitionNode,
    ObjectTypeDefinitionNode,
} from "graphql";
import { Neo4jGraphQLSchemaValidationError } from "../classes";
import getFieldTypeMeta from "../schema/get-field-type-meta";
import { filterTruthy } from "../utils/utils";
import { Neo4jGraphQLSchemaModel } from "./Neo4jGraphQLSchemaModel";
import type { Operations } from "./Neo4jGraphQLSchemaModel";
import type { Annotation } from "./annotation/Annotation";
import type { Attribute } from "./attribute/Attribute";
import { ConcreteEntity } from "./entity/ConcreteEntity";
import { findDirective } from "./parser/utils";
import { parseArguments } from "./parser/parse-arguments";
import type { NestedOperation, QueryDirection, RelationshipDirection } from "./relationship/Relationship";
import { Relationship } from "./relationship/Relationship";
import type { DefinitionCollection } from "./parser/definition-collection";
import { getDefinitionCollection } from "./parser/definition-collection";
import { Operation } from "./Operation";
import { parseAttribute, parseField } from "./parser/parse-attribute";
import { nodeDirective, relationshipDirective } from "../graphql/directives";
import { parseKeyAnnotation } from "./parser/annotations-parser/key-annotation";
import { parseAnnotations } from "./parser/parse-annotation";
import { InterfaceEntity } from "./entity/InterfaceEntity";
import { UnionEntity } from "./entity/UnionEntity";

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

    const concreteEntitiesMap = concreteEntities.reduce((acc, entity) => {
        if (acc.has(entity.name)) {
            throw new Neo4jGraphQLSchemaValidationError(`Duplicate node ${entity.name}`);
        }
        acc.set(entity.name, entity);
        return acc;
    }, new Map<string, ConcreteEntity>());

    const interfaceEntities = Array.from(definitionCollection.interfaceToImplementingTypeNamesMap.entries()).map(
        ([name, concreteEntities]) => {
            const interfaceNode = definitionCollection.interfaceTypes.get(name);
            if (!interfaceNode) {
                throw new Error(`Cannot find interface ${name}`);
            }
            return generateInterfaceEntity(
                name,
                interfaceNode,
                concreteEntities,
                concreteEntitiesMap,
                definitionCollection
            );
        }
    );
    const unionEntities = Array.from(definitionCollection.unionTypes).map(([unionName, unionDefinition]) => {
        return generateUnionEntity(
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
    definitionCollection.interfaceTypes.forEach((def) => hydrateRelationships(def, schema, definitionCollection));

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

function generateUnionEntity(
    entityDefinitionName: string,
    entityImplementingTypeNames: string[],
    concreteEntities: Map<string, ConcreteEntity>
): UnionEntity {
    const unionEntity = generateCompositeEntity(entityDefinitionName, entityImplementingTypeNames, concreteEntities);
    return new UnionEntity(unionEntity);
}

function generateInterfaceEntity(
    entityDefinitionName: string,
    definition: InterfaceTypeDefinitionNode,
    entityImplementingTypeNames: string[],
    concreteEntities: Map<string, ConcreteEntity>,
    definitionCollection: DefinitionCollection
): InterfaceEntity {
    const interfaceEntity = generateCompositeEntity(
        entityDefinitionName,
        entityImplementingTypeNames,
        concreteEntities
    );
    const inheritedFields =
        definition.interfaces?.flatMap((interfaceNamedNode) => {
            const interfaceName = interfaceNamedNode.name.value;
            return definitionCollection.interfaceTypes.get(interfaceName)?.fields || [];
        }) || [];
    const fields = (definition.fields || []).map((fieldDefinition) => {
        const inheritedField = inheritedFields?.filter(
            (inheritedField) => inheritedField.name.value === fieldDefinition.name.value
        );
        const isRelationshipAttribute = findDirective(fieldDefinition.directives, relationshipDirective.name);
        const isInheritedRelationshipAttribute = inheritedField?.some((inheritedField) =>
            findDirective(inheritedField.directives, relationshipDirective.name)
        );
        if (isRelationshipAttribute || isInheritedRelationshipAttribute) {
            return;
        }
        return parseAttribute(fieldDefinition, inheritedField, definitionCollection);
    });

    const inheritedDirectives =
        definition.interfaces?.flatMap((interfaceNamedNode) => {
            const interfaceName = interfaceNamedNode.name.value;
            return definitionCollection.interfaceTypes.get(interfaceName)?.directives || [];
        }) || [];
    const mergedDirectives = (definition.directives || []).concat(inheritedDirectives);
    const annotations = createEntityAnnotations(mergedDirectives);

    return new InterfaceEntity({
        ...interfaceEntity,
        attributes: filterTruthy(fields) as Attribute[],
        annotations,
    });
}

function generateCompositeEntity(
    entityDefinitionName: string,
    entityImplementingTypeNames: string[],
    concreteEntities: Map<string, ConcreteEntity>
): { name: string; concreteEntities: ConcreteEntity[] } {
    const compositeFields = entityImplementingTypeNames.map((type) => {
        const concreteEntity = concreteEntities.get(type);
        if (!concreteEntity) {
            throw new Neo4jGraphQLSchemaValidationError(`Could not find concrete entity with name ${type}`);
        }
        return concreteEntity;
    });
    /*  
   // This is commented out because is currently possible to have leaf interfaces as demonstrated in the test
   // packages/graphql/tests/integration/aggregations/where/node/string.int.test.ts 
   if (!compositeFields.length) {
        throw new Neo4jGraphQLSchemaValidationError(
            `Composite entity ${entityDefinitionName} has no concrete entities`
        );
    } */
    return {
        name: entityDefinitionName,
        concreteEntities: compositeFields,
    };
}

function hydrateRelationships(
    definition: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    schema: Neo4jGraphQLSchemaModel,
    definitionCollection: DefinitionCollection
): void {
    const name = definition.name.value;
    const entity = schema.getEntity(name);

    if (!entity) {
        throw new Error(`Cannot find entity ${name}`);
    }
    if (entity instanceof UnionEntity) {
        throw new Error(`Cannot add relationship to union entity ${name}`);
    }
    // TODO: fix ts
    const entityWithRelationships: ConcreteEntity | InterfaceEntity = entity as ConcreteEntity | InterfaceEntity;
    const inheritedFields =
        definition.interfaces?.flatMap((interfaceNamedNode) => {
            const interfaceName = interfaceNamedNode.name.value;
            return definitionCollection.interfaceTypes.get(interfaceName)?.fields || [];
        }) || [];
    // TODO: directives on definition have priority over interfaces
    const mergedFields = (definition.fields || []).concat(inheritedFields);
    const relationshipFieldsMap = new Map<string, Relationship>();
    for (const fieldDefinition of mergedFields) {
        // TODO: takes the first one
        // multiple interfaces can have this annotation - must constrain this flexibility by design
        if (relationshipFieldsMap.has(fieldDefinition.name.value)) {
            continue;
        }
        const mergedDirectives = mergedFields
            .filter((f) => f.name.value === fieldDefinition.name.value)
            .flatMap((f) => f.directives || []);
        const relationshipField = generateRelationshipField(
            fieldDefinition,
            schema,
            entityWithRelationships,
            definitionCollection,
            mergedDirectives
        );
        if (relationshipField) {
            relationshipFieldsMap.set(fieldDefinition.name.value, relationshipField);
        }
    }

    for (const relationship of relationshipFieldsMap.values()) {
        entityWithRelationships.addRelationship(relationship);
    }
}

function generateRelationshipField(
    field: FieldDefinitionNode,
    schema: Neo4jGraphQLSchemaModel,
    source: ConcreteEntity | InterfaceEntity,
    definitionCollection: DefinitionCollection,
    mergedDirectives: DirectiveNode[]
): Relationship | undefined {
    // TODO: remove reference to getFieldTypeMeta
    const fieldTypeMeta = getFieldTypeMeta(field.type);
    const relationshipUsage = findDirective(field.directives, "relationship");
    if (!relationshipUsage) return undefined;

    const fieldName = field.name.value;
    const relatedEntityName = fieldTypeMeta.name;
    const relatedToEntity = schema.getEntity(relatedEntityName);
    if (!relatedToEntity) throw new Error(`Entity ${relatedEntityName} Not Found`);
    const { type, direction, properties, queryDirection, nestedOperations, aggregate } = parseArguments(
        relationshipDirective,
        relationshipUsage
    );

    let attributes: Attribute[] = [];
    let propertiesTypeName: string | undefined = undefined;
    if (properties && typeof properties === "string") {
        const propertyInterface = definitionCollection.relationshipProperties.get(properties);
        if (!propertyInterface) {
            throw new Error(
                `The \`@relationshipProperties\` directive could not be found on the \`${properties}\` interface`
            );
        }
        propertiesTypeName = properties;

        const inheritedFields =
            propertyInterface.interfaces?.flatMap((interfaceNamedNode) => {
                const interfaceName = interfaceNamedNode.name.value;
                return definitionCollection.interfaceTypes.get(interfaceName)?.fields || [];
            }) || [];
        const fields = (propertyInterface.fields || []).map((fieldDefinition) => {
            const inheritedField = inheritedFields?.filter(
                (inheritedField) => inheritedField.name.value === fieldDefinition.name.value
            );
            return parseAttribute(fieldDefinition, inheritedField, definitionCollection);
        });

        attributes = filterTruthy(fields) as Attribute[];
    }

    const annotations = parseAnnotations(mergedDirectives);

    // TODO: add property interface name
    return new Relationship({
        name: fieldName,
        type: type as string,
        attributes,
        source,
        target: relatedToEntity,
        direction: direction as RelationshipDirection,
        isList: Boolean(fieldTypeMeta.array),
        queryDirection: queryDirection as QueryDirection,
        nestedOperations: nestedOperations as NestedOperation[],
        aggregate: aggregate as boolean,
        isNullable: !fieldTypeMeta.required,
        description: field.description?.value || "",
        annotations: annotations,
        propertiesTypeName,
    });
}

function generateConcreteEntity(
    definition: ObjectTypeDefinitionNode,
    definitionCollection: DefinitionCollection
): ConcreteEntity {
    const inheritedFields = definition.interfaces?.flatMap((interfaceNamedNode) => {
        const interfaceName = interfaceNamedNode.name.value;
        return definitionCollection.interfaceTypes.get(interfaceName)?.fields || [];
    });
    const fields = (definition.fields || []).map((fieldDefinition) => {
        const inheritedField = inheritedFields?.filter(
            (inheritedField) => inheritedField.name.value === fieldDefinition.name.value
        );
        const isRelationshipAttribute = findDirective(fieldDefinition.directives, relationshipDirective.name);
        const isInheritedRelationshipAttribute = inheritedField?.some((inheritedField) =>
            findDirective(inheritedField.directives, relationshipDirective.name)
        );
        if (isRelationshipAttribute || isInheritedRelationshipAttribute) {
            return;
        }
        return parseAttribute(fieldDefinition, inheritedField, definitionCollection);
    });

    const inheritedDirectives = inheritedFields?.flatMap((f) => f.directives || []) || [];
    const annotations = createEntityAnnotations((definition.directives || []).concat(inheritedDirectives));

    return new ConcreteEntity({
        name: definition.name.value,
        description: definition.description?.value,
        labels: getLabels(definition),
        attributes: filterTruthy(fields) as Attribute[],
        annotations,
    });
}

function getLabels(entityDefinition: ObjectTypeDefinitionNode): string[] {
    const nodeDirectiveUsage = findDirective(entityDefinition.directives, nodeDirective.name);
    if (nodeDirectiveUsage) {
        const nodeArguments = parseArguments<{ labels?: string[] }>(nodeDirective, nodeDirectiveUsage);
        if (nodeArguments.labels?.length) {
            return nodeArguments.labels;
        }
    }
    return [entityDefinition.name.value];
}

function createEntityAnnotations(directives: readonly DirectiveNode[]): Annotation[] {
    const entityAnnotations: Annotation[] = [];

    // TODO: I think this is done already with the map change and we do not have repeatable directives

    // We only ever want to create one annotation even when an entity contains several key directives
    const keyDirectives = directives.filter((directive) => directive.name.value === "key");
    if (keyDirectives) {
        entityAnnotations.push(parseKeyAnnotation(keyDirectives));
    }
    const annotations = parseAnnotations(directives);

    return entityAnnotations.concat(annotations);
}

function createSchemaModelAnnotations(directives: readonly DirectiveNode[]): Annotation[] {
    const schemaModelAnnotations: Annotation[] = [];

    const annotations = parseAnnotations(directives);

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
