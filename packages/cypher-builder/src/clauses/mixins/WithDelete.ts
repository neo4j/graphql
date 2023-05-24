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

import { ClauseMixin } from "./ClauseMixin";
import type { DeleteInput } from "../sub-clauses/Delete";
import { DeleteClause } from "../sub-clauses/Delete";

export abstract class WithDelete extends ClauseMixin {
    protected deleteClause: DeleteClause | undefined;

    /** Attach a DELETE subclause
     * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/clauses/delete/)
     */
    public delete(...deleteInput: DeleteInput): this {
        this.createDeleteClause(deleteInput);
        return this;
    }

    /** Attach a DETACH DELETE subclause
     * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/clauses/delete/)
     */
    public detachDelete(...deleteInput: DeleteInput): this {
        const deleteClause = this.createDeleteClause(deleteInput);
        deleteClause.detach();
        return this;
    }

    private createDeleteClause(deleteInput: DeleteInput): DeleteClause {
        this.deleteClause = new DeleteClause(this, deleteInput);
        return this.deleteClause;
    }
}
