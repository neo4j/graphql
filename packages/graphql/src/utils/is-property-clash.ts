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

import type { Node } from "../classes";

/* returns true if clashes exist between the db property names of the mutation inputs */
export function doDbPropertiesClash({ node, input }: { node: Node; input: Map<string, any> | undefined }): boolean {
    if (!input) {
        return false;
    }
    const mutationFieldNameToDbNameMap = node.primitiveFields.reduce((acc, el) => {
        acc[el.fieldName] = el.dbPropertyName;
        return acc;
    }, {});
    const inputFieldsDbName = Object.keys(input)
        .map((fieldName) => mutationFieldNameToDbNameMap[fieldName])
        // some input fields are not primitive fields (eg relation fields) => no corresponding db name in the map
        .filter((x) => x !== undefined);

    const fieldPropertyCount = inputFieldsDbName.length;
    const uniqueDbPropertyCount = new Set(inputFieldsDbName).size;
    // each field property should have a unique correspondent db property
    return fieldPropertyCount !== uniqueDbPropertyCount;
}
