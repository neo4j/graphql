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

import Debug from "debug";
import { Session } from "neo4j-driver";
import { NodeDirective } from "./classes/NodeDirective";
import { NodeField } from "./classes/NodeField";
import { Relationship } from "./classes/Relationship";
import { RelationshipDirective } from "./classes/RelationshipDirective";
import { GraphQLNode } from "./classes/GraphQLNode";
import { DEBUG_INFER_SCHEMA } from "./constants";
import { inferRelationshipFieldName } from "./infer-relationship-field-name";
import { mapNeo4jToGraphQLType } from "./map-neo4j-to-graphql-type";
import { uniqueString } from "./unique-string";

const debug = Debug(DEBUG_INFER_SCHEMA);

type NodeMap = {
    [key: string]: GraphQLNode;
};

type NodeTypePropertiesRecord = {
    nodeType: string;
    nodeLabels: string[];
    propertyName: string;
    propertyTypes: string[];
    mandatory: boolean;
};
type RelationshipTypePropertiesRecord = {
    relType: string;
    propertyName: string;
    propertyTypes: string[];
    mandatory: boolean;
};
type RelationshipRecord = {
    from: string;
    to: string;
    relType: string;
};

export async function inferSchema(sessionFactory: () => Session): Promise<string> {
    // Nodes
    const typeNodes = await inferNodes(sessionFactory);

    // Rels
    const relationships = await inferRelationships(sessionFactory);

    const hydratedNodes = hydrateRelationships(typeNodes, relationships);

    const sorted = Object.keys(hydratedNodes).sort();
    return sorted.map((typeName) => typeNodes[typeName].toString()).join("\n\n");
}

function hydrateRelationships(nodes: NodeMap, rels: Relationship[]): NodeMap {
    rels.forEach((rel) => {
        const from = nodes[rel.from];
        const to = nodes[rel.to];

        const fromField = new NodeField(
            inferRelationshipFieldName(rel.type, from.typeName, to.typeName, "OUT"),
            `[${to.typeName}]`
        );
        const fromDirective = new RelationshipDirective(rel.type, "OUT");
        fromField.addDirective(fromDirective);
        from.addField(fromField);

        const toField = new NodeField(
            inferRelationshipFieldName(rel.type, from.typeName, to.typeName, "IN"),
            `[${from.typeName}]`
        );
        const toDirective = new RelationshipDirective(rel.type, "IN");
        toField.addDirective(toDirective);
        to.addField(toField);
    });
    return nodes;
}

async function inferRelationships(sessionFactory: () => Session): Promise<Relationship[]> {
    const rels: Relationship[] = [];
    const relSession = sessionFactory();
    const typePropsRes = await relSession.readTransaction((tx) =>
        tx.run(`CALL db.schema.relTypeProperties()
    YIELD relType, propertyName, propertyTypes, mandatory
    RETURN *`)
    );
    await relSession.close();
    const relTypeProperties = typePropsRes.records.map((r) => r.toObject()) as RelationshipTypePropertiesRecord[];
    const uniqueRelTypes = new Set(relTypeProperties.map((nt) => nt.relType));
    const queries: Promise<typeof typePropsRes>[] = [];
    uniqueRelTypes.forEach((relType) => {
        const propertiesRows = relTypeProperties.filter((nt) => nt.relType === relType);
        if (!propertiesRows) {
            return;
        }

        // Check node identifiers it's connected to
        async function sessionClosure() {
            const conSession = sessionFactory();
            await new Promise((r) => setTimeout(r, 3000));
            const relationshipsRes = await conSession.readTransaction((tx) =>
                tx.run(`
            MATCH (n)-[r${relType}]->(m)
            WITH n, r, m LIMIT 100
            WITH DISTINCT labels(n) AS from, labels(m) AS to
            WITH from, to WHERE SIZE(from) > 0 AND SIZE(to) > 0
            RETURN from, to, "${relType.replace(/"/g, '\\"')}" AS relType`)
            );
            await conSession.close();
            return relationshipsRes;
        }

        queries.push(sessionClosure());
        // propertiesRows.forEach((row) => {
        // });
    });
    const results = await Promise.all(queries);
    results.forEach((result) => {
        const relationships = result.records.map((r) => r.toObject()) as RelationshipRecord[];
        if (!relationships) {
            return;
        }
        const { relType } = relationships[0];
        const typeOnly = relType.slice(2, -1);
        relationships.forEach(({ from, to }) => {
            rels.push(new Relationship(typeOnly, from, to));
        });
    });

    return rels;
}

async function inferNodes(sessionFactory: () => Session): Promise<NodeMap> {
    const nodes: NodeMap = {};
    // Label properties
    const session = sessionFactory();
    const labelPropsRes = await session.readTransaction((tx) =>
        tx.run(`CALL db.schema.nodeTypeProperties()
    YIELD nodeType, nodeLabels, propertyName, propertyTypes, mandatory
    RETURN *`)
    );
    await session.close();
    if (!labelPropsRes?.records.length) {
        return nodes;
    }
    const nodeTypeProperties = labelPropsRes.records.map((r) => r.toObject()) as NodeTypePropertiesRecord[];

    // Find unique "nodeType"s to build TypeNode instances
    const takenTypeNames: string[] = [];
    new Set(nodeTypeProperties.map((nt) => nt.nodeType)).forEach((nodeType) => {
        const propertiesRows = nodeTypeProperties.filter((nt) => nt.nodeType === nodeType);
        if (!propertiesRows) {
            return;
        }
        const { nodeLabels } = propertiesRows[0];
        const mainLabel = nodeLabels[0];
        const typeName = mainLabel.replace(/[^_0-9A-Z]+/gi, "_");

        const uniqueTypeName = uniqueString(typeName, takenTypeNames);
        takenTypeNames.push(uniqueTypeName);

        const node = new GraphQLNode("type", uniqueTypeName);
        const nodeDirective = new NodeDirective();
        if (mainLabel !== uniqueTypeName) {
            nodeDirective.addLabel(mainLabel);
        }
        nodeDirective.addAdditionalLabels(nodeLabels.slice(1));
        node.addDirective(nodeDirective);

        propertiesRows.forEach((propertyRow) => {
            if (!propertyRow.propertyTypes) {
                if (debug.enabled) {
                    debug("%s", `No properties on ${nodeType}. Skipping generation.`);
                }
                return;
            }
            if (propertyRow.propertyTypes.length > 1) {
                if (debug.enabled) {
                    debug(
                        "%s",
                        `Ambiguous types on ${nodeType}.${propertyRow.propertyName}. Fix the inconsistences for this property to be included`
                    );
                }
                return;
            }
            node.addField(
                new NodeField(
                    propertyRow.propertyName,
                    mapNeo4jToGraphQLType(propertyRow.propertyTypes, propertyRow.mandatory)
                )
            );
        });
        if (node.fields.length) {
            nodes[mainLabel] = node;
        }
    });
    return nodes;
}
