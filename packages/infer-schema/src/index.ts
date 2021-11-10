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
import { NodeField } from "./classes/NodeField";
import { RelationshipDirective } from "./classes/RelationshipDirective";
import { RelationshipType } from "./classes/RelationshipType";
import { TypeNode } from "./classes/TypeNode";
import { DEBUG_INFER_SCHEMA } from "./constants";
import { inferRelationshipFieldName } from "./infer-relationship-field-name";
import { mapNeo4jToGraphQLType } from "./map-neo4j-to-graphql-type";

const debug = Debug(DEBUG_INFER_SCHEMA);

type NodeMap = {
    [key: string]: TypeNode;
};
type RelationshipMap = {
    [key: string]: RelationshipType;
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

export async function inferSchema(session: Session): Promise<string> {
    // Nodes
    const typeNodes = await inferNodes(session);

    // Rels
    const relationships = await inferRelationships(session);

    const hydratedNodes = hydrateRelationships(typeNodes, relationships);

    const sorted = Object.keys(hydratedNodes).sort();
    return sorted.map((typeName) => typeNodes[typeName].toString()).join("\n\n");
}

function hydrateRelationships(nodes: NodeMap, rels: RelationshipMap): NodeMap {
    Object.keys(rels).forEach((relType) => {
        const { relationships } = rels[relType];
        relationships.forEach((rel) => {
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
    });
    return nodes;
}

async function inferRelationships(session: Session): Promise<RelationshipMap> {
    const rels: RelationshipMap = {};
    const typePropsRes = await session.readTransaction((tx) =>
        tx.run(`CALL db.schema.relTypeProperties()
    YIELD relType, propertyName, propertyTypes, mandatory
    RETURN *`)
    );
    const relTypeProperties = typePropsRes.records.map((r) => r.toObject()) as RelationshipTypePropertiesRecord[];
    const uniqueRelTypes = new Set(relTypeProperties.map((nt) => nt.relType));
    const queries: Promise<typeof typePropsRes>[] = [];
    uniqueRelTypes.forEach((relType) => {
        const propertiesRows = relTypeProperties.filter((nt) => nt.relType === relType);
        if (!propertiesRows) {
            return;
        }

        // Check node identifiers it's connected to
        const relationshipsRes = session.readTransaction((tx) =>
            tx.run(`
        MATCH (n)-[r${relType}]->(m)
        WITH n, r, m LIMIT 100
        WITH DISTINCT labels(n) AS from, labels(m) AS to
        WITH from, to WHERE SIZE(from) > 0 AND SIZE(to) > 0
        RETURN from, to, "${relType.replace(/"/g, '\\"')}" AS relType`)
        );
        queries.push(relationshipsRes);
        // propertiesRows.forEach((row) => {
        // });
    });
    const results = await Promise.all(queries);
    results.forEach((result, i) => {
        const relationships = result.records.map((r) => r.toObject()) as RelationshipRecord[];
        if (!relationships) {
            return;
        }
        const { relType } = relationships[0];
        const typeOnly = relType.slice(2, -1);
        const rel = new RelationshipType(typeOnly);
        relationships.forEach(({ from, to }) => {
            rel.addRelationship(from, to);
        });
        rels[typeOnly] = rel;
    });

    return rels;
}

async function inferNodes(session: Session): Promise<NodeMap> {
    const nodes: NodeMap = {};
    // Label properties
    const labelPropsRes = await session.readTransaction((tx) =>
        tx.run(`CALL db.schema.nodeTypeProperties()
    YIELD nodeType, nodeLabels, propertyName, propertyTypes, mandatory
    RETURN *`)
    );
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
        let counter = 2;
        let uniqueTypeName = typeName;
        // Avoid type name clashes
        while (takenTypeNames.includes(uniqueTypeName)) {
            uniqueTypeName = typeName + String(counter);
            counter += 1;
        }
        takenTypeNames.push(uniqueTypeName);
        const typeNode = new TypeNode(uniqueTypeName, mainLabel, nodeLabels.slice(1));
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
            typeNode.addField(
                new NodeField(
                    propertyRow.propertyName,
                    mapNeo4jToGraphQLType(propertyRow.propertyTypes, propertyRow.mandatory)
                )
            );
        });
        if (typeNode.fields.length) {
            nodes[mainLabel] = typeNode;
        }
    });
    return nodes;
}
