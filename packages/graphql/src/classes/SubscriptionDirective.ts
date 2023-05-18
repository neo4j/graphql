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

export class SubscriptionDirective {
    public create: boolean;
    public update: boolean;
    public delete: boolean;
    public createRelationship: boolean;
    public deleteRelationship: boolean;

    constructor(operations?: ("CREATE" | "UPDATE" | "DELETE" | "CREATE_RELATIONSHIP" | "DELETE_RELATIONSHIP")[]) {
        this.create = !!operations?.find((operation) => operation === "CREATE");
        this.update = !!operations?.find((operation) => operation === "UPDATE");
        this.delete = !!operations?.find((operation) => operation === "DELETE");
        this.createRelationship = !!operations?.find((operation) => operation === "CREATE_RELATIONSHIP");
        this.deleteRelationship = !!operations?.find((operation) => operation === "DELETE_RELATIONSHIP");
    }
}
