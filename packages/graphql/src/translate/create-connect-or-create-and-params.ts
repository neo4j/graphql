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

import type { RelationField, Context, PrimitiveField } from "../types";
import type { Node, Relationship } from "../classes";
import { Neo4jGraphQLError } from "../classes";
import type { CallbackBucket } from "../classes/CallbackBucket";
import { createAuthAndParams } from "./create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import { asArray, omitFields } from "../utils/utils";
import Cypher from "@neo4j/cypher-builder";
import { addCallbackAndSetParamCypher } from "./utils/callback-utils";
import { findConflictingProperties } from "../utils/is-property-clash";
import { createConnectionEventMeta } from "./subscriptions/create-connection-event-meta";
import { filterMetaVariable } from "./subscriptions/filter-meta-variable";
import { getCypherRelationshipDirection } from "../utils/get-relationship-direction";

type CreateOrConnectInput = {
    where?: {
        node: Record<string, any>;
    };
    onCreate?: {
        node?: Record<string, any>;
        edge?: Record<string, any>;
    };
};

export function createConnectOrCreateAndParams({
    input,
    varName,
    parentVar,
    relationField,
    refNode,
    node,
    context,
    withVars,
    callbackBucket,
}: {
    input: CreateOrConnectInput[] | CreateOrConnectInput;
    varName: string;
    parentVar: string;
    relationField: RelationField;
    refNode: Node;
    node: Node;
    context: Context;
    withVars: string[];
    callbackBucket: CallbackBucket;
}): Cypher.CypherResult {
    asArray(input).forEach((connectOrCreateItem) => {
        const conflictingProperties = findConflictingProperties({
            node: refNode,
            input: connectOrCreateItem.onCreate?.node,
        });
        if (conflictingProperties.length > 0) {
            throw new Neo4jGraphQLError(
                `Conflicting modification of ${conflictingProperties.map((n) => `[[${n}]]`).join(", ")} on type ${
                    refNode.name
                }`
            );
        }
    });

    const withVarsVariables = withVars.map((name) => new Cypher.NamedVariable(name));

    const statements = asArray(input).map((inputItem, index) => {
        const subqueryBaseName = `${varName}${index}`;
        const result = createConnectOrCreatePartialStatement({
            input: inputItem,
            baseName: subqueryBaseName,
            parentVar,
            relationField,
            refNode,
            node,
            context,
            callbackBucket,
            withVars,
        });
        return result;
    });

    const wrappedQueries = statements.map((statement) => {
        const countResult = new Cypher.RawCypher(() => {
            if (context.subscriptionsEnabled) {
                return "meta as update_meta";
            }
            return "COUNT(*) AS _";
        });
        const returnStatement = new Cypher.Return(countResult);
        const withStatement = new Cypher.With(...withVarsVariables);
        const callStatement = new Cypher.Call(Cypher.concat(statement, returnStatement)).innerWith(
            ...withVarsVariables
        );
        const subqueryClause = Cypher.concat(withStatement, callStatement);
        if (context.subscriptionsEnabled) {
            const afterCallWithStatement = new Cypher.With("*", [new Cypher.NamedVariable("update_meta"), "meta"]);
            Cypher.concat(subqueryClause, afterCallWithStatement);
        }

        return subqueryClause;
    });

    const query = Cypher.concat(...wrappedQueries);

    return query.build(`${varName}_`);
}

function createConnectOrCreatePartialStatement({
    input,
    baseName,
    parentVar,
    relationField,
    refNode,
    node,
    context,
    callbackBucket,
    withVars,
}: {
    input: CreateOrConnectInput;
    baseName: string;
    parentVar: string;
    relationField: RelationField;
    refNode: Node;
    node: Node;
    context: Context;
    callbackBucket: CallbackBucket;
    withVars: string[];
}): Cypher.Clause {
    const mergeQuery = mergeStatement({
        input,
        refNode,
        parentRefNode: node,
        context,
        relationField,
        parentNode: new Cypher.NamedNode(parentVar),
        varName: baseName,
        callbackBucket,
        withVars,
    });

    const authQuery = createAuthStatement({
        node: refNode,
        context,
        nodeName: baseName,
    });

    if (authQuery) {
        return Cypher.concat(mergeQuery, new Cypher.With("*"), authQuery);
    }
    return mergeQuery;
}

function mergeStatement({
    input,
    refNode,
    parentRefNode,
    context,
    relationField,
    parentNode,
    varName,
    callbackBucket,
    withVars,
}: {
    input: CreateOrConnectInput;
    refNode: Node;
    parentRefNode: Node;
    context: Context;
    relationField: RelationField;
    parentNode: Cypher.Node;
    varName: string;
    callbackBucket: CallbackBucket;
    withVars: string[];
}): Cypher.Clause {
    const whereNodeParameters = getCypherParameters(input.where?.node, refNode);
    const onCreateNodeParameters = getCypherParameters(input.onCreate?.node, refNode);

    const autogeneratedParams = getAutogeneratedParams(refNode);
    const node = new Cypher.NamedNode(varName, {
        labels: refNode.getLabels(context),
    });
    const nodePattern = new Cypher.Pattern(node).withProperties(whereNodeParameters);

    const unsetAutogeneratedParams = omitFields(autogeneratedParams, Object.keys(whereNodeParameters));
    const callbackFields = getCallbackFields(refNode);

    const callbackParams = callbackFields
        .map((callbackField): [Cypher.PropertyRef, Cypher.RawCypher] | [] => {
            const varNameVariable = new Cypher.NamedVariable(varName);
            return addCallbackAndSetParamCypher(
                callbackField,
                varNameVariable,
                parentNode,
                callbackBucket,
                "CREATE",
                node
            );
        })
        .filter((tuple) => tuple.length !== 0) as [Cypher.PropertyRef, Cypher.RawCypher][];

    const rawNodeParams = {
        ...unsetAutogeneratedParams,
        ...onCreateNodeParameters,
    };

    const onCreateParams = Object.entries(rawNodeParams).map(([key, param]): [Cypher.PropertyRef, Cypher.Param] => {
        return [node.property(key), param];
    });

    const merge = new Cypher.Merge(nodePattern).onCreate(...onCreateParams, ...callbackParams);

    const relationshipFields = context.relationships.find((x) => x.properties === relationField.properties);
    const autogeneratedRelationshipParams = relationshipFields ? getAutogeneratedParams(relationshipFields) : {};
    const rawOnCreateRelationshipParams = convertToCypherParams(input.onCreate?.edge || {});

    const rawRelationshipParams = {
        ...autogeneratedRelationshipParams,
        ...rawOnCreateRelationshipParams,
    };

    const relationship = new Cypher.Relationship({ type: relationField.type });
    const direction = getCypherRelationshipDirection(relationField);
    const relationshipPattern = new Cypher.Pattern(parentNode)
        .related(relationship)
        .withDirection(direction)
        .to(node)
        .withoutLabels();

    const onCreateRelationshipParams = Object.entries(rawRelationshipParams).map(
        ([key, param]): [Cypher.PropertyRef, Cypher.Param] => {
            return [relationship.property(key), param];
        }
    );
    const relationshipMerge = new Cypher.Merge(relationshipPattern).onCreate(...onCreateRelationshipParams);

    let withClause: Cypher.Clause | undefined;
    if (context.subscriptionsEnabled) {
        const [fromTypename, toTypename] =
            relationField.direction === "IN" ? [refNode.name, parentRefNode.name] : [parentRefNode.name, refNode.name];
        const [fromNode, toNode] = relationField.direction === "IN" ? [node, parentNode] : [parentNode, node];

        withClause = new Cypher.RawCypher((env: Cypher.Environment) => {
            const eventWithMetaStr = createConnectionEventMeta({
                event: "create_relationship",
                relVariable: relationship.getCypher(env),
                fromVariable: fromNode.getCypher(env),
                toVariable: toNode.getCypher(env),
                typename: relationField.type,
                fromTypename,
                toTypename,
            });
            return `WITH ${eventWithMetaStr}, ${filterMetaVariable([...withVars, varName]).join(", ")}`;
        });
    }

    return Cypher.concat(merge, relationshipMerge, withClause);
}

function createAuthStatement({
    node,
    context,
    nodeName,
}: {
    node: Node;
    context: Context;
    nodeName: string;
}): Cypher.Clause | undefined {
    if (!node.auth) return undefined;

    const { cypher, params } = createAuthAndParams({
        entity: node,
        operations: ["CONNECT", "CREATE"],
        context,
        allow: { node, varName: nodeName },
        escapeQuotes: false,
    });

    if (!cypher) return undefined;

    return new Cypher.RawCypher(() => {
        const predicate = `NOT (${cypher})`;
        const message = AUTH_FORBIDDEN_ERROR;

        const cypherStr = `CALL apoc.util.validate(${predicate}, "${message}", [0])`;

        return [cypherStr, params];
    });
}

function getCallbackFields(node: Node | Relationship): PrimitiveField[] {
    const callbackFields = node.primitiveFields.filter((f) => f.callback);
    return callbackFields;
}

// Helper for compatibility reasons
function getAutogeneratedParams(node: Node | Relationship): Record<string, Cypher.Param<any>> {
    const autogeneratedFields = node.primitiveFields
        .filter((f) => f.autogenerate)
        .reduce((acc, field) => {
            if (field.dbPropertyName) {
                acc[field.dbPropertyName] = new Cypher.RawCypher("randomUUID()");
            }
            return acc;
        }, {});

    const autogeneratedTemporalFields = node.temporalFields
        .filter((field) => ["DateTime", "Time"].includes(field.typeMeta.name) && field.timestamps?.includes("CREATE"))
        .reduce((acc, field) => {
            if (field.dbPropertyName) {
                acc[field.dbPropertyName] = new Cypher.RawCypher(`${field.typeMeta.name.toLowerCase()}()`);
            }
            return acc;
        }, {});
    return { ...autogeneratedTemporalFields, ...autogeneratedFields };
}

function getCypherParameters(onCreateParams: Record<string, any> = {}, node?: Node): Record<string, Cypher.Param<any>> {
    const params = Object.entries(onCreateParams).reduce((acc, [key, value]) => {
        const nodeField = node?.constrainableFields.find((f) => f.fieldName === key);
        const nodeFieldName = nodeField?.dbPropertyName || nodeField?.fieldName;
        const fieldName = nodeFieldName || key;
        const valueOrArray = nodeField?.typeMeta.array ? asArray(value) : value;
        acc[fieldName] = valueOrArray;
        return acc;
    }, {});
    return convertToCypherParams(params);
}

// Based on cypher builder convertToCypherParams
function convertToCypherParams<T>(original: Record<string, T>): Record<string, Cypher.Param<T>> {
    return Object.entries(original).reduce((acc, [key, value]) => {
        acc[key] = new Cypher.Param(value);
        return acc;
    }, {});
}
