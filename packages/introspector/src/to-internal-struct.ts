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

import { Session } from "neo4j-driver";
import Node from "./classes/Node";
import Property from "./classes/Property";
import Relationship from "./classes/Relationship";
import { Neo4jStruct, NodeMap, PropertyRecord, RelationshipMap } from "./types";
import cleanTypeName from "./utils/clean-type-name";
import nodeKey from "./utils/node-key";

interface NodeTypePropertiesRecord extends PropertyRecord {
    nodeType: string;
    nodeLabels: string[];
}
interface RelationshipTypePropertiesRecord extends PropertyRecord {
    relType: string;
}

type RelationshipRecord = {
    from: string[];
    to: string[];
    relType: string;
};

export default async function toNeo4jStruct(sessionFactory: () => Session): Promise<Neo4jStruct> {
    const nodes = await introspectNodes(sessionFactory);
    const relationships = await introspectRelationships(sessionFactory);

    return { nodes, relationships };
}

async function introspectNodes(sessionFactory: () => Session): Promise<NodeMap> {
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
    new Set(nodeTypeProperties.map((nt) => nt.nodeType)).forEach((nodeType) => {
        const propertiesRows = nodeTypeProperties.filter((nt) => nt.nodeType === nodeType);
        if (!propertiesRows) {
            return;
        }
        const { nodeLabels } = propertiesRows[0];
        const node = new Node(nodeType, nodeLabels);
        propertiesRows.forEach((p) => {
            if (!p.propertyName) {
                return;
            }
            node.addProperty(new Property(p.propertyName, p.propertyTypes, p.mandatory));
        });
        nodes[nodeType] = node;
    });

    return nodes;
}

async function introspectRelationships(sessionFactory: () => Session): Promise<RelationshipMap> {
    const relSession = sessionFactory();
    const rels: RelationshipMap = {};

    // Find all relationship types and their properties (if any)
    const typePropsRes = await relSession.readTransaction((tx) =>
        tx.run(`CALL db.schema.relTypeProperties()
    YIELD relType, propertyName, propertyTypes, mandatory
    RETURN *`)
    );
    await relSession.close();
    const relTypePropertiesRecords = typePropsRes.records.map((r) =>
        r.toObject()
    ) as RelationshipTypePropertiesRecord[];
    const uniqueRelTypes = new Set(relTypePropertiesRecords.map((nt) => nt.relType));
    const queries: Promise<typeof typePropsRes>[] = [];

    // Go through each unique relationship type and check
    // what node labels are connected with it
    uniqueRelTypes.forEach((relType) => {
        const propertiesRows = relTypePropertiesRecords.filter((nt) => nt.relType === relType);
        if (!propertiesRows) {
            return;
        }

        // Check node identifiers it's connected to
        // Run in parallel
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
        const typeOnly = cleanTypeName(relType);
        const relationship = new Relationship(typeOnly);
        if (propertiesRows.length) {
            propertiesRows.forEach((p) => {
                if (!p.propertyName) {
                    return;
                }
                relationship.addProperty(new Property(p.propertyName, p.propertyTypes, p.mandatory));
            });
        }
        rels[typeOnly] = relationship;
    });
    const results = await Promise.all(queries);

    // Go through each unique path and add it to the relationship type
    results.forEach((result) => {
        const paths = result.records.map((r) => r.toObject()) as RelationshipRecord[];
        if (!paths) {
            return;
        }
        const { relType } = paths[0];
        const typeOnly = cleanTypeName(relType);
        const relationship = rels[typeOnly];
        paths.forEach(({ from, to }) => relationship.addPath(nodeKey(from), nodeKey(to)));
    });

    return rels;
}
