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
import { generate } from "randomstring";
import {
    generateMissingOrAliasedFields,
    generateProjectionField,
    getAliasedResolveTreeByFieldName,
    getResolveTreeByFieldName,
} from "./resolveTree";

describe("resolveTree", () => {
    const names = ["field1", "field2", "field3"];
    const aliasMap = new Map();
    names.forEach((name) => aliasMap.set(name, generate({ charset: "alphabetic" })));

    const nonAliasedSelection: Record<string, ResolveTree> = names.reduce(
        (acc, name) => ({
            ...acc,
            [name]: {
                alias: name,
                name,
                fieldsByTypeName: {},
                args: {},
            },
        }),
        {},
    );

    const aliasedSelection: Record<string, ResolveTree> = names.reduce((acc, name) => {
        const alias = aliasMap.get(name);
        return {
            ...acc,
            [alias]: {
                alias,
                name,
                fieldsByTypeName: {},
                args: {},
            },
        };
    }, {});

    test("generate projection field", () => {
        const name = generate({ charset: "alphabetic" });

        const field = generateProjectionField({ name });

        expect(field).toStrictEqual({
            [name]: {
                name,
                alias: name,
                fieldsByTypeName: {},
                args: {},
            },
        });
    });

    test("generate aliased projection field", () => {
        const alias = generate({ charset: "alphabetic" });
        const name = generate({ charset: "alphabetic" });

        const resolveTree = generateProjectionField({ name, alias });

        expect(resolveTree).toStrictEqual({
            [name]: {
                name,
                alias,
                fieldsByTypeName: {},
                args: {},
            },
        });
    });

    test("get field by field name", () => {
        const resolveTree = getResolveTreeByFieldName({ fieldName: names[2], selection: nonAliasedSelection });
        expect(resolveTree).toStrictEqual(nonAliasedSelection[names[2]]);
    });

    test("get aliased resolve tree by field name", () => {
        const resolveTree = getAliasedResolveTreeByFieldName({ fieldName: names[1], selection: aliasedSelection });
        expect(resolveTree).toStrictEqual(aliasedSelection[aliasMap.get(names[1])]);
    });

    test("generate missing resolve trees", () => {
        const missingFieldNames = Array(3)
            .fill(null)
            .map(() => generate({ charset: "alphabetic" }));

        const fields = generateMissingOrAliasedFields({
            selection: nonAliasedSelection,
            fieldNames: [...names, ...missingFieldNames],
        });

        expect(fields).toStrictEqual(
            missingFieldNames.reduce(
                (acc, name) => ({
                    ...acc,
                    [name]: {
                        name,
                        alias: name,
                        fieldsByTypeName: {},
                        args: {},
                    },
                }),
                {},
            ),
        );
    });

    test("generate aliased and missing resolve trees", () => {
        const missingFieldNames = Array(3)
            .fill(null)
            .map(() => generate({ charset: "alphabetic" }));
        const fields = generateMissingOrAliasedFields({
            selection: aliasedSelection,
            fieldNames: [...names, ...missingFieldNames],
        });

        expect(fields).toStrictEqual(
            [...names, ...missingFieldNames].reduce(
                (acc, name) => ({
                    ...acc,
                    [name]: {
                        name,
                        alias: name,
                        fieldsByTypeName: {},
                        args: {},
                    },
                }),
                {},
            ),
        );
    });
});
