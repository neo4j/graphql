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

import { FieldDefinitionNode, InputValueDefinitionNode, Kind, ListTypeNode, TypeNode } from "graphql";
import { TypeMeta } from "../types";

function getName(type: TypeNode): string {
    return type.kind === Kind.NAMED_TYPE ? type.name.value : getName(type.type);
}

function getPrettyName(type: TypeNode): string {
    let result: string;

    // eslint-disable-next-line default-case
    switch (type.kind) {
        case Kind.NAMED_TYPE:
            result = type.name.value;
            break;
        case Kind.NON_NULL_TYPE:
            result = `${getPrettyName(type.type)}!`;
            break;
        case Kind.LIST_TYPE:
            result = `[${getPrettyName(type.type)}]`;
            break;
    }

    return result;
}

function getFieldTypeMeta(field: FieldDefinitionNode | InputValueDefinitionNode): TypeMeta {
    const name = getName(field.type);
    const pretty = getPrettyName(field.type);
    const array = /\[.+\]/g.test(pretty);
    const required = field.type.kind === Kind.NON_NULL_TYPE;

    // Things to do with the T inside the Array [T]
    let arrayTypePretty = "";
    let arrayTypeRequired = false;
    if (array) {
        const listNode = field.type as ListTypeNode;
        const isMatrix = listNode.type.kind === Kind.LIST_TYPE && listNode.type.type.kind === Kind.LIST_TYPE;

        if (isMatrix) {
            throw new Error("Matrix arrays not supported");
        }

        arrayTypePretty = getPrettyName(listNode.type);
        arrayTypeRequired = arrayTypePretty.includes("!");
    }

    const baseMeta = {
        name,
        array,
        required,
        pretty,
        arrayTypePretty,
    };

    const isPoint = ["Point", "CartesianPoint"].includes(name);
    let type = name;
    if (isPoint) {
        type = name === "Point" ? "PointInput" : "CartesianPointInput";
    }

    let inputPretty = type;
    if (array) {
        inputPretty = `[${type}${arrayTypeRequired ? "!" : ""}]`;
    }

    return {
        ...baseMeta,
        input: {
            where: { type, pretty: inputPretty },
            create: {
                type: name,
                pretty: `${inputPretty}${required ? "!" : ""}`,
            },
            update: {
                type: name,
                pretty: inputPretty,
            },
        },
    };
}

export default getFieldTypeMeta;
