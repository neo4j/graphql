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

import type { ResolveTree } from "graphql-parse-resolve-info";
import { Point } from "neo4j-driver";
import { CartesianPoint } from "../../../graphql/objects/CartesianPoint";
import type { Attribute } from "../../../schema-model/attribute/Attribute";
import { ListType } from "../../../schema-model/attribute/AttributeType";
import { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import type { Relationship } from "../../../schema-model/relationship/Relationship";
import type {
    GraphQLTreeCartesianPoint,
    GraphQLTreeLeafField,
    GraphQLTreePoint,
    GraphQLTreeScalarField,
} from "./graphql-tree/attributes";
import { findFieldByName } from "./utils/find-field-by-name";

export function parseAttributeField(
    resolveTree: ResolveTree,
    entity: ConcreteEntity | Relationship
): GraphQLTreeLeafField | GraphQLTreePoint | undefined {
    const globalIdField = parseGlobalIdField(resolveTree, entity);
    if (globalIdField) {
        return globalIdField;
    }

    if (entity.hasAttribute(resolveTree.name)) {
        const attribute = entity.findAttribute(resolveTree.name) as Attribute;
        const wrappedTypeName = attribute.type instanceof ListType ? attribute.type.ofType.name : attribute.type.name;
        if (wrappedTypeName === "Point") {
            return parsePointField(resolveTree);
        }
        if (wrappedTypeName === "CartesianPoint") {
            return parseCartesianPointField(resolveTree);
        }
        return {
            alias: resolveTree.alias,
            args: resolveTree.args,
            name: resolveTree.name,
            fields: undefined,
        };
    }
}

function parseGlobalIdField(
    resolveTree: ResolveTree,
    entity: ConcreteEntity | Relationship
): GraphQLTreeLeafField | undefined {
    if (resolveTree.name === "id") {
        if (entity instanceof ConcreteEntity && entity.globalIdField) {
            return {
                alias: entity.globalIdField.name,
                args: resolveTree.args,
                name: resolveTree.name,
                fields: undefined,
            };
        }
    }
}

function parsePointField(resolveTree: ResolveTree): GraphQLTreePoint {
    const longitude = findFieldByName(resolveTree, Point.name, "longitude");
    const latitude = findFieldByName(resolveTree, Point.name, "latitude");
    const height = findFieldByName(resolveTree, Point.name, "height");
    const crs = findFieldByName(resolveTree, Point.name, "crs");
    const srid = findFieldByName(resolveTree, Point.name, "srid");

    return {
        alias: resolveTree.alias,
        args: resolveTree.args,
        name: resolveTree.name,
        fields: {
            longitude: resolveTreeToLeafField(longitude),
            latitude: resolveTreeToLeafField(latitude),
            height: resolveTreeToLeafField(height),
            crs: resolveTreeToLeafField(crs),
            srid: resolveTreeToLeafField(srid),
        },
    };
}

function parseCartesianPointField(resolveTree: ResolveTree): GraphQLTreeCartesianPoint {
    const x = findFieldByName(resolveTree, CartesianPoint.name, "x");
    const y = findFieldByName(resolveTree, CartesianPoint.name, "y");
    const z = findFieldByName(resolveTree, CartesianPoint.name, "z");
    const crs = findFieldByName(resolveTree, CartesianPoint.name, "crs");
    const srid = findFieldByName(resolveTree, CartesianPoint.name, "srid");

    return {
        alias: resolveTree.alias,
        args: resolveTree.args,
        name: resolveTree.name,
        fields: {
            x: resolveTreeToLeafField(x),
            y: resolveTreeToLeafField(y),
            z: resolveTreeToLeafField(z),
            crs: resolveTreeToLeafField(crs),
            srid: resolveTreeToLeafField(srid),
        },
    };
}

function resolveTreeToLeafField(resolveTree: ResolveTree | undefined): GraphQLTreeScalarField | undefined {
    if (!resolveTree) {
        return undefined;
    }
    return {
        alias: resolveTree.alias,
        args: resolveTree.args,
        name: resolveTree.name,
    };
}
