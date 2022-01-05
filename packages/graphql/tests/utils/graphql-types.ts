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

// This file should only be used for tests. As randomstring is a devDependecy
// eslint-disable-next-line import/no-extraneous-dependencies
import { generate } from "randomstring";
import pluralize from "pluralize";
import camelCase from "camelcase";
import { upperFirst } from "graphql-compose";

export function generateUniqueType(baseName: string): TestType {
    const type = `${generate({
        charset: "alphabetic",
        readable: true,
    })}${baseName}`;

    const plural = pluralize(camelCase(type));
    const pascalCasePlural = upperFirst(plural);

    return {
        name: type,
        plural,
        methods: {
            create: `create${pascalCasePlural}`,
            update: `update${pascalCasePlural}`,
            delete: `delete${pascalCasePlural}`,
        },
    };
}

export type TestType = {
    name: string;
    plural: string;
    methods: {
        create: string;
        update: string;
        delete: string;
    };
};
