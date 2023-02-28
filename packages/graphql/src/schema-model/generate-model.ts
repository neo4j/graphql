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
import {
    ArgumentNode,
    DirectiveNode,
    DocumentNode,
    FieldDefinitionNode,
    Kind,
    ObjectFieldNode,
    ObjectTypeDefinitionNode,
    UnionTypeDefinitionNode,
    ValueNode,
} from "graphql";
import { SCALAR_TYPES } from "../constants";
import { getDefinitionNodes } from "../schema/get-definition-nodes";
import getFieldTypeMeta from "../schema/get-field-type-meta";
import { filterTruthy } from "../utils/utils";
import type { Annotation } from "./annotation/Annotation";
import {
    AuthorizationAnnotation,
    AuthorizationFilterRule,
    AuthorizationFilterRules,
} from "./annotation/AuthorizationAnnotation";
import { CypherAnnotation } from "./annotation/CypherAnnotation";
import { Attribute } from "./attribute/Attribute";
import { CompositeEntity } from "./entity/CompositeEntity";
import { ConcreteEntity } from "./entity/ConcreteEntity";
import { Neo4jGraphQLSchemaModel } from "./Neo4jGraphQLSchemaModel";

export function generateModel(document: DocumentNode): Neo4jGraphQLSchemaModel {
    const definitionNodes = getDefinitionNodes(document);
    const concreteEntities = definitionNodes.objectTypes.map(generateConcreteEntity);
    const concreteEntitiesMap = concreteEntities.reduce((acc, entity) => {
        if (acc.has(entity.name)) {
            throw new Error(`Duplicate node ${entity.name}`);
        }
        acc.set(entity.name, entity);
        return acc;
    }, new Map<string, ConcreteEntity>());

    // TODO: add interfaces as well
    const compositeEntities = definitionNodes.unionTypes.map((entity) => {
        return generateCompositeEntity(entity, concreteEntitiesMap);
    });

    return new Neo4jGraphQLSchemaModel({ compositeEntities, concreteEntities });
}

function generateCompositeEntity(
    definition: UnionTypeDefinitionNode,
    concreteEntities: Map<string, ConcreteEntity>
): CompositeEntity {
    const compositeFields = (definition.types || []).map((type) => {
        const concreteEntity = concreteEntities.get(type.name.value);
        if (!concreteEntity) {
            throw new Error(`Could not find concrete entity with name ${type.name.value}`);
        }
        return concreteEntity;
    });

    if (!compositeFields.length) {
        throw new Error(`Composite entity ${definition.name.value} has no concrete entities`);
    }
    return new CompositeEntity({
        name: definition.name.value,
        concreteEntities: compositeFields,
    });
}

function generateConcreteEntity(definition: ObjectTypeDefinitionNode): ConcreteEntity {
    const fields = (definition.fields || []).map(generateField);
    const directives = (definition.directives || []).reduce((acc, directive) => {
        acc.set(directive.name.value, parseArguments(directive));
        return acc;
    }, new Map<string, Record<string, unknown>>());
    const labels = getLabels(definition, directives.get("node") || {});

    return new ConcreteEntity({
        name: definition.name.value,
        labels,
        attributes: filterTruthy(fields),
        annotations: createEntityAnnotation(definition.directives || []),
    });
}

function getLabels(definition: ObjectTypeDefinitionNode, nodeDirectiveArguments: Record<string, unknown>): string[] {
    if ((nodeDirectiveArguments.labels as string[] | undefined)?.length) {
        return nodeDirectiveArguments.labels as string[];
    }
    return [definition.name.value];
}

function generateField(field: FieldDefinitionNode): Attribute | undefined {
    const typeMeta = getFieldTypeMeta(field.type); // TODO: without originalType
    if (SCALAR_TYPES.includes(typeMeta.name)) {
        const annotations = createFieldAnnotations(field.directives || []);
        return new Attribute({
            name: field.name.value,
            annotations,
        });
    }
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

function createEntityAnnotation(directives: readonly DirectiveNode[]): Annotation[] {
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

// validation helpers
function avalidateAuthorizationFilterRule(argument: ArgumentNode | ObjectFieldNode) {
    if (argument?.value.kind !== Kind.LIST) {
        throw new Error(`${argument.name.value} should be a List`);
    }
    if (argument?.value.values.find((v) => v.kind !== Kind.OBJECT)) {
        throw new Error(`${argument.name.value} rules should be objects`);
    }
}
function validateAuthorizationAnnotation(directive: DirectiveNode) {
    const dirArgs = directive.arguments;
    const filterBeforeValidation = dirArgs?.find((arg) => arg.name.value === "filter");
    if (filterBeforeValidation) {
        avalidateAuthorizationFilterRule(filterBeforeValidation);
    }
    const validateBeforeValidation = dirArgs?.find((arg) => arg.name.value === "validate");
    if (validateBeforeValidation) {
        if (validateBeforeValidation?.value.kind !== Kind.OBJECT) {
            throw new Error("validate should be an Object");
        }
        const validateFieldsBeforeValidation = validateBeforeValidation?.value.fields
            .filter((f) => ["pre", "post"].includes(f.name.value))
            .map(avalidateAuthorizationFilterRule);
        if (!validateFieldsBeforeValidation.length) {
            throw new Error("validate should contain `pre` or `post`");
        }
    }
    const filterSubscriptionsBeforeValidation = dirArgs?.find((arg) => arg.name.value === "filterSubscriptions");
    if (filterSubscriptionsBeforeValidation) {
        avalidateAuthorizationFilterRule(filterSubscriptionsBeforeValidation);
    }
}

function parseAuthorizationAnnotation(directive: DirectiveNode): AuthorizationAnnotation {
    validateAuthorizationAnnotation(directive);
    const { filter, filterSubscriptions, validate } = parseArguments(directive) as {
        filter?: Record<string, any>[];
        filterSubscriptions?: Record<string, any>[];
        validate?: { pre: Record<string, any>[]; post: Record<string, any>[] };
    };
    // TODO: validate further than  Record<string, any>
    if (!filter && !filterSubscriptions && !validate) {
        throw new Error("one of filter/ filterSubscriptions/ validate required");
    }

    const filterRules = filter?.map(
        (rule) => new AuthorizationFilterRule({ ...rule, ruleType: AuthorizationFilterRules.filter })
    );
    const filterSubscriptionRules = filterSubscriptions?.map(
        (rule) => new AuthorizationFilterRule({ ...rule, ruleType: AuthorizationFilterRules.filterSubscription })
    );
    const validatePreRules = validate?.pre?.map(
        (rule) => new AuthorizationFilterRule({ ...rule, ruleType: AuthorizationFilterRules.validationPre })
    );
    const validatePostRules = validate?.post?.map(
        (rule) => new AuthorizationFilterRule({ ...rule, ruleType: AuthorizationFilterRules.validationPost })
    );

    return new AuthorizationAnnotation({
        filter: filterRules,
        filterSubscriptions: filterSubscriptionRules,
        validatePre: validatePreRules,
        validatePost: validatePostRules,
    });
}

function parseCypherAnnotation(directive: DirectiveNode): CypherAnnotation {
    const { statement } = parseArguments(directive);
    if (!statement || typeof statement !== "string") {
        throw new Error("@cypher statement required");
    }
    return new CypherAnnotation({
        statement: statement,
    });
}

function parseArguments(directive: DirectiveNode): Record<string, unknown> {
    return (directive.arguments || [])?.reduce((acc, argument) => {
        acc[argument.name.value] = getArgumentValueByType(argument.value);
        return acc;
    }, {});
}

function getArgumentValueByType(argumentValue: ValueNode): unknown {
    // TODO: parse other kinds
    if (argumentValue.kind === Kind.STRING) {
        return argumentValue.value;
    }
    if (argumentValue.kind === Kind.LIST) {
        return argumentValue.values.map((v) => getArgumentValueByType(v));
    }

    if (argumentValue.kind === Kind.OBJECT) {
        return argumentValue.fields.reduce((acc, field) => {
            acc[field.name.value] = getArgumentValueByType(field.value);
            return acc;
        }, {});
    }
}
