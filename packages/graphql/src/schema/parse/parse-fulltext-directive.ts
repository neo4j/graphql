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

import type { ArgumentNode, DirectiveNode, ObjectTypeDefinitionNode } from "graphql";
import type { FullText, FulltextIndex } from "../../types";
import type { ObjectFields } from "../get-obj-field-meta";
import parseValueNode from "../parse-value-node";

function parseFulltextDirective({
    directive,
    nodeFields,
    definition,
}: {
    directive: DirectiveNode;
    nodeFields: ObjectFields;
    definition: ObjectTypeDefinitionNode;
}): FullText {
    const indexesArg = directive.arguments?.find((arg) => arg.name.value === "indexes") as ArgumentNode;
    const value = parseValueNode(indexesArg.value) as FulltextIndex[];
    const compatibleFields = nodeFields.primitiveFields.filter(
        (f) => ["String", "ID"].includes(f.typeMeta.name) && !f.typeMeta.array
    );

    value.forEach((index) => {
        // TODO: remove indexName assignment and undefined check once the name argument has been removed.
        const indexName = index.indexName || index.name;
        if (indexName === undefined) {
            throw new Error("The name of the fulltext index should be defined using the indexName argument.");
        }
        const names = value.filter((i) => (indexName === i.indexName) || (indexName === i.name));
        if (names.length > 1) {
            throw new Error(`Node '${definition.name.value}' @fulltext index contains duplicate name '${indexName}'`);
        }

        index.fields.forEach((field) => {
            const foundField = compatibleFields.find((f) => f.fieldName === field);
            if (!foundField) {
                throw new Error(
                    `Node '${definition.name.value}' @fulltext index contains invalid index '${indexName}' cannot use find String or ID field '${field}'`
                );
            }
        });
    });

    return { indexes: value };
}

export default parseFulltextDirective;
