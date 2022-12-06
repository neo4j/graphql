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
import type { NodeRef } from "../../references/NodeRef";
import type { RelationshipRef } from "../../references/RelationshipRef";

export type DeleteInput = Array<NodeRef | RelationshipRef>;

export class DeleteClause extends CypherASTNode {
    private deleteInput: DeleteInput;
    private _detach = false;

    constructor(parent: CypherASTNode | undefined, deleteInput: DeleteInput) {
        super(parent);
        this.deleteInput = deleteInput;
    }

    public detach(): void {
        this._detach = true;
    }

    public getCypher(env: CypherEnvironment): string {
        const itemsToDelete = this.deleteInput.map((e) => e.getCypher(env));
        const detachStr = this._detach ? "DETACH " : "";
        return `${detachStr}DELETE ${itemsToDelete.join(",")}`;
    }
}
