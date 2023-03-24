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
import type { DefinitionNodes } from "../schema/get-definition-nodes";
import { getDefinitionNodes } from "../schema/get-definition-nodes";
import getFieldTypeMeta from "../schema/get-field-type-meta";
import { filterTruthy } from "../utils/utils";
import type { Annotation } from "./annotation/Annotation";
import { Attribute, AttributeType } from "./attribute/Attribute";
import { CompositeEntity } from "./entity/CompositeEntity";
import { ConcreteEntity } from "./entity/ConcreteEntity";
import { Neo4jGraphQLSchemaModel } from "./Neo4jGraphQLSchemaModel";
import { parseAuthorizationAnnotation } from "./parser/authorization-annotation";
import { parseCypherAnnotation } from "./parser/cypher-annotation";
import { parseArguments } from "./parser/utils";
import { Relationship } from "./relationship/Relationship";

export function generateModel(document: DocumentNode): Neo4jGraphQLSchemaModel {
    const definitionNodes = getDefinitionNodes(document);

    // init interface to typennames map
    const interfaceToImplementingTypeNamesMap = initInterfacesToTypenamesMap(definitionNodes);
    // hydrate interface to typennames map
    hydrateInterfacesToTypenamesMap(definitionNodes, interfaceToImplementingTypeNamesMap);

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
    const schema = new Neo4jGraphQLSchemaModel({
        compositeEntities: [...unionEntities, ...interfaceEntities],
        concreteEntities,
    });
    definitionNodes.objectTypes.map((def) => hydrateRelationships(def, schema, definitionNodes));
    return schema;
}

function initInterfacesToTypenamesMap(definitionNodes: DefinitionNodes) {
    return definitionNodes.interfaceTypes.reduce((acc, entity) => {
        const interfaceTypeName = entity.name.value;
        acc.set(interfaceTypeName, []);
        return acc;
    }, new Map<string, string[]>());
}

function hydrateInterfacesToTypenamesMap(
    definitionNodes: DefinitionNodes,
    interfaceToImplementingTypeNamesMap: Map<string, string[]>
) {
    return definitionNodes.objectTypes.forEach((el) => {
        if (!el.interfaces) {
            return;
        }
        const objectTypeName = el.name.value;
        el.interfaces?.forEach((i) => {
            const interfaceTypeName = i.name.value;
            const concreteEntities = interfaceToImplementingTypeNamesMap.get(interfaceTypeName);
            if (!concreteEntities) {
                throw new Neo4jGraphQLSchemaValidationError(
                    `Could not find composite entity with name ${interfaceTypeName}`
                );
            }
            interfaceToImplementingTypeNamesMap.set(interfaceTypeName, concreteEntities.concat(objectTypeName));
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

    // TODO: fix for interfaces annotated with @relationshipFields - which will never have concrete entities
    // if (!compositeFields.length) {
    //     throw new Neo4jGraphQLSchemaValidationError(
    //         `Composite entity ${entityDefinitionName} has no concrete entities`
    //     );
    // }
    // TODO: add annotations
    return new CompositeEntity({
        name: entityDefinitionName,
        concreteEntities: compositeFields,
    });
}

function hydrateRelationships(
    definition: ObjectTypeDefinitionNode,
    schema: Neo4jGraphQLSchemaModel,
    definitionNodes: DefinitionNodes
): void {
    const name = definition.name.value;
    const entity = schema.getEntity(name);

    if (!(entity instanceof ConcreteEntity)) {
        throw new Error(`Cannot add relationship to non-concrete entity ${entity.name}`);
    }

    const relationshipPropertyInterfaces = getRelationshipPropertiesInterfaces(definitionNodes);
    if (!entity) throw new Error(`Entity ${name} not found while creating relationships`);

    const relationshipFields = (definition.fields || []).map((fieldDefinition) => {
        // TODO: use same relationship for 2 diferent entities if possible
        return generateRelationshipField(fieldDefinition, schema, entity, relationshipPropertyInterfaces);
    });

    for (const relationship of filterTruthy(relationshipFields)) {
        entity.addRelationship(relationship);
    }
}

function getRelationshipPropertiesInterfaces(
    definitionNodes: DefinitionNodes
): Map<string, InterfaceTypeDefinitionNode> {
    return (
        definitionNodes.interfaceTypes
            // Uncomment this to enforce @relationshipProperties in 4.0
            // .filter((interfaceDef: InterfaceTypeDefinitionNode) => {
            //     const relDirective = findDirective(interfaceDef.directives || [], "relationshipProperties");
            //     return Boolean(relDirective);
            // })
            .reduce((acc, interfaceDef) => {
                acc.set(interfaceDef.name.value, interfaceDef);
                return acc;
            }, new Map<string, InterfaceTypeDefinitionNode>())
    );
}

function generateRelationshipField(
    field: FieldDefinitionNode,
    schema: Neo4jGraphQLSchemaModel,
    source: ConcreteEntity,
    propertyInterfaces: Map<string, InterfaceTypeDefinitionNode>
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
    if (properties) {
        const propertyInterface = propertyInterfaces.get(properties as string);
        if (!propertyInterface) throw new Error("Property interfaces not defined with @relationshipProperties");
        const fields = (propertyInterface?.fields || []).map(generateField);
        attributes = filterTruthy(fields);
    }
    return new Relationship({
        name: fieldName,
        type: type as string,
        attributes,
        source,
        target: relatedToEntity,
        direction: direction as "IN" | "OUT",
    });
}

function generateConcreteEntity(definition: ObjectTypeDefinitionNode): ConcreteEntity {
    const fields = (definition.fields || []).map((fieldDefinition) => generateField(fieldDefinition));

    const directives = (definition.directives || []).reduce((acc, directive) => {
        acc.set(directive.name.value, parseArguments(directive));
        return acc;
    }, new Map<string, Record<string, unknown>>());
    const labels = getLabels(definition, directives.get("node") || {});
    // TODO: add annotations inherited from interface

    return new ConcreteEntity({
        name: definition.name.value,
        labels,
        attributes: filterTruthy(fields),
        annotations: createEntityAnnotations(definition.directives || []),
    });
}

function getLabels(definition: ObjectTypeDefinitionNode, nodeDirectiveArguments: Record<string, unknown>): string[] {
    // TODO: use when removing label & additionalLabels
    // const nodeExplicitLabels = nodeDirectiveArguments.labels as string[];
    // return nodeExplicitLabels ?? [definition.name.value];
    if ((nodeDirectiveArguments.labels as string[] | undefined)?.length) {
        return nodeDirectiveArguments.labels as string[];
    }
    const nodeLabel = nodeDirectiveArguments.label as string | undefined;
    const additionalLabels = (nodeDirectiveArguments.additionalLabels || []) as string[];
    const label = nodeLabel || definition.name.value;
    return [label, ...additionalLabels];
}

function generateField(field: FieldDefinitionNode): Attribute | undefined {
    const typeMeta = getFieldTypeMeta(field.type); // TODO: without originalType
    if (isAttributeType(typeMeta.name)) {
        const annotations = createFieldAnnotations(field.directives || []);
        return new Attribute({
            name: field.name.value,
            annotations,
            type: typeMeta.name,
            isArray: Boolean(typeMeta.array),
        });
    }
}

function isAttributeType(typeName: string): typeName is AttributeType {
    return Object.values(AttributeType).includes(typeName as any);
}

function findDirective(directives: readonly DirectiveNode[], name: string): DirectiveNode | undefined {
    return directives.find((d) => {
        return d.name.value === name;
    });
}

function createFieldAnnotations(directives: readonly DirectiveNode[]): Annotation[] {
    return filterTruthy(
        directives.map((directive) => {
            switch (directive.name.value) {
                case "cypher":
                    return parseCypherAnnotation(directive);
                case "authorization":
                    return parseAuthorizationAnnotation(directive);
                default:
                    return undefined;
            }
        })
    );
}

function createEntityAnnotations(directives: readonly DirectiveNode[]): Annotation[] {
    return filterTruthy(
        directives.map((directive) => {
            switch (directive.name.value) {
                case "authorization":
                    return parseAuthorizationAnnotation(directive);
                default:
                    return undefined;
            }
        })
    );
}
