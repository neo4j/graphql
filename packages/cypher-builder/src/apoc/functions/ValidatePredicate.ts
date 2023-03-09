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

import { CypherASTNode } from "../../CypherASTNode";
import type { CypherEnvironment } from "../../Environment";
import type { Predicate } from "../../types";

// Note, this is a procedure, but acts as a predicate expression
/**
 * @group Expressions
 * @category Cypher Functions
 */
export class ValidatePredicate extends CypherASTNode {
    private predicate: Predicate;
    private message: string;

    constructor(predicate: Predicate, message: string) {
        super();
        this.predicate = predicate;
        this.message = message;
    }

    /** @internal */
    public getCypher(env: CypherEnvironment): string {
        const predicateCypher = this.predicate.getCypher(env);
        return `apoc.util.validatePredicate(${predicateCypher}, "${this.message}", [0])`;
    }
}
