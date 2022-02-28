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

import { CypherASTNode } from "../CypherASTNode";
import { CypherContext } from "../CypherContext";
import { Query } from "./Query";

type ApocValidateOptions = {
    predicate: string;
    message: string;
};

class ApocValidate extends Query {
    options: ApocValidateOptions;

    constructor(options: ApocValidateOptions, parent?: CypherASTNode) {
        super(parent);
        this.options = options;
    }

    public cypher(_context: CypherContext, childrenCypher: string): string {
        const statements = [this.options.predicate, `"${this.options.message}"`, "[0]"].join(", ");

        return `CALL apoc.util.validate(${statements})\n${childrenCypher}`;
    }
}

export const Apoc = {
    Validate: ApocValidate,
};
