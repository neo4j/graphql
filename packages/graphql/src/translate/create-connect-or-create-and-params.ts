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

import type { RelationField, Context } from "../types";
import type { Node, Relationship } from "../classes";
import createAuthAndParams from "./create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import { asArray, omitFields } from "../utils/utils";
import * as CypherBuilder from "./cypher-builder/CypherBuilder";
import { convertToCypherParams } from "./cypher-builder/utils";

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
    context,
    withVars,
}: {
    input: CreateOrConnectInput[] | CreateOrConnectInput;
    varName: string;
    parentVar: string;
    relationField: RelationField;
    refNode: Node;
    context: Context;
    withVars: string[];
}): CypherBuilder.CypherResult {
    const withVarsVariables = withVars.map((name) => new CypherBuilder.NamedVariable(name));

    const statements = asArray(input).map((inputItem, index) => {
        const subqueryBaseName = `${varName}${index}`;
        const result = createConnectOrCreatePartialStatement({
            input: inputItem,
            baseName: subqueryBaseName,
            parentVar,
            relationField,
            refNode,
            context,
        });
        return result;
    });

    const wrappedQueries = statements.map((statement) => {
        const returnStatement = new CypherBuilder.Return("COUNT(*) AS _");
        const withStatement = new CypherBuilder.With(...withVarsVariables);
        const callStatement = new CypherBuilder.Call(CypherBuilder.concat(statement, returnStatement)).with(
            ...withVarsVariables
        );

        return CypherBuilder.concat(withStatement, callStatement);
    });

    const query = CypherBuilder.concat(...wrappedQueries);

    return query.build(`${varName}_`);
}

function createConnectOrCreatePartialStatement({
    input,
    baseName,
    parentVar,
    relationField,
    refNode,
    context,
}: {
    input: CreateOrConnectInput;
    baseName: string;
    parentVar: string;
    relationField: RelationField;
    refNode: Node;
    context: Context;
}): CypherBuilder.Clause {
    const mergeQuery = mergeStatement({
        input,
        refNode,
        context,
        relationField,
        parentNode: new CypherBuilder.NamedNode(parentVar),
    });

    const authQuery = createAuthStatement({
        node: refNode,
        context,
        nodeName: baseName,
    });

    if (authQuery) {
        return CypherBuilder.concat(authQuery, mergeQuery);
    }
    return mergeQuery;
}

function mergeStatement({
    input,
    refNode,
    context,
    relationField,
    parentNode,
}: {
    input: CreateOrConnectInput;
    refNode: Node;
    context: Context;
    relationField: RelationField;
    parentNode: CypherBuilder.Node;
}): CypherBuilder.Clause {
    const whereNodeParameters = getCypherParameters(input.where?.node, refNode);
    const onCreateNodeParameters = getCypherParameters(input.onCreate?.node, refNode);

    const autogeneratedParams = getAutogeneratedParams(refNode);
    const node = new CypherBuilder.Node({
        labels: refNode.getLabels(context),
    });

    const unsetAutogeneratedParams = omitFields(autogeneratedParams, Object.keys(whereNodeParameters));

    const rawNodeParams = {
        ...unsetAutogeneratedParams,
        ...onCreateNodeParameters,
    };

    const onCreateParams = Object.entries(rawNodeParams).map(
        ([key, param]): [CypherBuilder.PropertyRef, CypherBuilder.Param] => {
            return [node.property(key), param];
        }
    );

    const merge = new CypherBuilder.Merge(node, whereNodeParameters).onCreate(...onCreateParams);

    const relationshipFields = context.relationships.find((x) => x.properties === relationField.properties);
    const autogeneratedRelationshipParams = relationshipFields ? getAutogeneratedParams(relationshipFields) : {};
    const rawOnCreateRelationshipParams = convertToCypherParams(input.onCreate?.edge || {});

    const rawRelationshipParams = {
        ...autogeneratedRelationshipParams,
        ...rawOnCreateRelationshipParams,
    };

    const relationship = new CypherBuilder.Relationship({
        source: relationField.direction === "IN" ? node : parentNode,
        target: relationField.direction === "IN" ? parentNode : node,
        type: relationField.type,
    });

    const onCreateRelationshipParams = Object.entries(rawRelationshipParams).map(
        ([key, param]): [CypherBuilder.PropertyRef, CypherBuilder.Param] => {
            return [relationship.property(key), param];
        }
    );

    const relationshipMerge = new CypherBuilder.Merge(relationship).onCreate(...onCreateRelationshipParams);
    return CypherBuilder.concat(merge, relationshipMerge);
}

function createAuthStatement({
    node,
    context,
    nodeName,
}: {
    node: Node;
    context: Context;
    nodeName: string;
}): CypherBuilder.Clause | undefined {
    if (!node.auth) return undefined;

    const auth = createAuthAndParams({
        entity: node,
        operations: ["CONNECT", "CREATE"],
        context,
        allow: { parentNode: node, varName: nodeName, chainStr: `${nodeName}${node.name}_allow` },
        escapeQuotes: false,
    });

    return new CypherBuilder.RawCypher((env) => {
        const predicate = `NOT (${auth[0]})`;
        const message = AUTH_FORBIDDEN_ERROR;

        const cypherStr = `CALL apoc.util.validate(${predicate}, "${message}", [0])`;

        return [cypherStr, auth[1]];
    });
}

// Helper for compatibility reasons
function getAutogeneratedParams(node: Node | Relationship): Record<string, CypherBuilder.Param<any>> {
    const autogeneratedFields = node.primitiveFields
        .filter((f) => f.autogenerate)
        .reduce((acc, field) => {
            if (field.dbPropertyName) {
                acc[field.dbPropertyName] = new CypherBuilder.RawParam("randomUUID()");
            }
            return acc;
        }, {});

    const autogeneratedTemporalFields = node.temporalFields
        .filter((field) => ["DateTime", "Time"].includes(field.typeMeta.name) && field.timestamps?.includes("CREATE"))
        .reduce((acc, field) => {
            if (field.dbPropertyName) {
                acc[field.dbPropertyName] = new CypherBuilder.RawParam(`${field.typeMeta.name.toLowerCase()}()`);
            }
            return acc;
        }, {});
    return { ...autogeneratedTemporalFields, ...autogeneratedFields };
}

function getCypherParameters(
    onCreateParams: Record<string, any> = {},
    node?: Node
): Record<string, CypherBuilder.Param<any>> {
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
