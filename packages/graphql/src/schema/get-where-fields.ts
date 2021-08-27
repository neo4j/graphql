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

import { CustomEnumField, CustomScalarField, DateTimeField, PointField, PrimitiveField } from "../types";

interface Fields {
    scalarFields: CustomScalarField[];
    enumFields: CustomEnumField[];
    primitiveFields: PrimitiveField[];
    dateTimeFields: DateTimeField[];
    pointFields: PointField[];
}

function getWhereFields({
    typeName,
    fields,
    enableRegex,
}: {
    typeName: string;
    fields: Fields;
    enableRegex?: boolean;
}) {
    return {
        OR: `[${typeName}Where!]`,
        AND: `[${typeName}Where!]`,
        // Custom scalar fields only support basic equality
        ...fields.scalarFields.reduce((res, f) => {
            res[f.fieldName] = f.typeMeta.array ? `[${f.typeMeta.name}]` : f.typeMeta.name;
            return res;
        }, {}),
        ...[...fields.primitiveFields, ...fields.dateTimeFields, ...fields.enumFields, ...fields.pointFields].reduce(
            (res, f) => {
                res[f.fieldName] = f.typeMeta.input.where.pretty;
                res[`${f.fieldName}_NOT`] = f.typeMeta.input.where.pretty;

                if (f.typeMeta.name === "Boolean") {
                    return res;
                }

                if (f.typeMeta.array) {
                    res[`${f.fieldName}_INCLUDES`] = f.typeMeta.input.where.type;
                    res[`${f.fieldName}_NOT_INCLUDES`] = f.typeMeta.input.where.type;
                    return res;
                }

                res[`${f.fieldName}_IN`] = `[${f.typeMeta.input.where.pretty}]`;
                res[`${f.fieldName}_NOT_IN`] = `[${f.typeMeta.input.where.pretty}]`;

                if (["Float", "Int", "BigInt", "DateTime", "Date", "Duration"].includes(f.typeMeta.name)) {
                    ["_LT", "_LTE", "_GT", "_GTE"].forEach((comparator) => {
                        res[`${f.fieldName}${comparator}`] = f.typeMeta.name;
                    });
                    return res;
                }

                if (["Point", "CartesianPoint"].includes(f.typeMeta.name)) {
                    ["_DISTANCE", "_LT", "_LTE", "_GT", "_GTE"].forEach((comparator) => {
                        res[`${f.fieldName}${comparator}`] = `${f.typeMeta.name}Distance`;
                    });
                    return res;
                }

                if (["String", "ID"].includes(f.typeMeta.name)) {
                    if (enableRegex) {
                        res[`${f.fieldName}_MATCHES`] = "String";
                    }

                    [
                        "_CONTAINS",
                        "_NOT_CONTAINS",
                        "_STARTS_WITH",
                        "_NOT_STARTS_WITH",
                        "_ENDS_WITH",
                        "_NOT_ENDS_WITH",
                    ].forEach((comparator) => {
                        res[`${f.fieldName}${comparator}`] = f.typeMeta.name;
                    });
                    return res;
                }

                return res;
            },
            {}
        ),
    };
}

export default getWhereFields;
