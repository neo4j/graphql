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

import { InterfaceTypeDefinitionNode, Kind, ObjectTypeDefinitionNode } from "graphql";
import equal from "deep-equal";

const nodeInterfaceDef = {
    kind: Kind.INTERFACE_TYPE_DEFINITION,
    description: {
        kind: Kind.STRING,
        value: "Globally-identifiable node (Relay)",
    },
    name: {
        kind: Kind.NAME,
        value: "Node",
    },
    fields: [
        {
            name: {
                kind: Kind.NAME,
                value: "id",
            },
            kind: Kind.FIELD_DEFINITION,
            arguments: [],
            type: {
                kind: Kind.NON_NULL_TYPE,
                type: {
                    kind: Kind.NAMED_TYPE,
                    name: {
                        kind: Kind.NAME,
                        value: "ID",
                    },
                },
            },
            directives: [
                {
                    kind: Kind.DIRECTIVE,
                    name: {
                        kind: Kind.NAME,
                        value: "id",
                    },
                    arguments: [],
                },
            ],
        },
    ],
    directives: [],
};

function stripLoc(obj: any) {
    return JSON.parse(
        JSON.stringify(obj, (key: string, value) => {
            if (key === "loc") {
                return undefined;
            }

            return value;
        })
    );
}

function checkNodeImplementsInterfaces(node: ObjectTypeDefinitionNode, interfaces: InterfaceTypeDefinitionNode[]) {
    if (!node.interfaces?.length) {
        return;
    }

    node.interfaces.forEach((inter) => {
        const error = new Error(`type ${node.name.value} does not implement interface ${inter.name.value} correctly`);

        const interDefinition = [...interfaces, nodeInterfaceDef].find((x) => x.name.value === inter.name.value);
        if (!interDefinition) {
            throw error;
        }

        interDefinition.directives?.forEach((interDirec) => {
            const nodeDirec = node.directives?.find((x) => x.name.value === interDirec.name.value);
            if (!nodeDirec) {
                throw error;
            }

            const isEqual = equal(stripLoc(nodeDirec), stripLoc(interDirec));
            if (!isEqual) {
                throw error;
            }
        });

        interDefinition.fields?.forEach((interField) => {
            const nodeField = node.fields?.find((x) => x.name.value === interField.name.value);
            if (!nodeField) {
                throw error;
            }

            const isEqual = equal(stripLoc(nodeField), stripLoc(interField));
            if (!isEqual) {
                throw error;
            }
        });
    });
}

export default checkNodeImplementsInterfaces;
