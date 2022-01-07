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
import { upperFirst } from "graphql-compose";

export function generateUniqueType(baseName: string) {
    const type = `${generate({
        length: 8,
        charset: "alphabetic",
        readable: true,
    })}${baseName}`;

    function lowerFirst(str: string): string {
        return `${str.charAt(0).toLowerCase()}${str.slice(1)}`;
    }
    const plural = lowerFirst(pluralize(type));
    const pascalCasePlural = upperFirst(plural);

    return {
        name: type,
        plural,
        operations: {
            create: `create${pascalCasePlural}`,
            update: `update${pascalCasePlural}`,
            delete: `delete${pascalCasePlural}`,
            aggregate: `${plural}Aggregate`,
            count: `${plural}Count`,
        },
    };
}
