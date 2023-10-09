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

import { upperFirst } from "../../../utils/upper-first";
import type { UnionEntityAdapter } from "./UnionEntityAdapter";
type RootTypeFieldNames = {
    // create: string;
    read: string;
    // update: string;
    // delete: string;
    // aggregate: string;
    // subscribe: {
    //     created: string;
    //     updated: string;
    //     deleted: string;
    //     relationship_created: string;
    //     relationship_deleted: string;
    // };
};

export class UnionEntityOperations {
    private readonly unionEntityAdapter: UnionEntityAdapter;

    private readonly pascalCasePlural: string;
    private readonly pascalCaseSingular: string;

    constructor(unionEntityAdapter: UnionEntityAdapter) {
        this.unionEntityAdapter = unionEntityAdapter;
        this.pascalCasePlural = upperFirst(this.unionEntityAdapter.plural);
        this.pascalCaseSingular = upperFirst(this.unionEntityAdapter.singular);
    }

    public get whereInputTypeName(): string {
        return `${this.unionEntityAdapter.name}Where`;
    }

    public get subscriptionEventPayloadTypeName(): string {
        return `${this.unionEntityAdapter.name}EventPayload`;
    }

    public get rootTypeFieldNames(): RootTypeFieldNames {
        return {
            // create: `create${this.pascalCasePlural}`,
            read: this.unionEntityAdapter.plural,
            // update: `update${this.pascalCasePlural}`,
            // delete: `delete${this.pascalCasePlural}`,
            // aggregate: `${this.unionEntityAdapter.plural}Aggregate`,
            // subscribe: {
            //     created: `${this.unionEntityAdapter.singular}Created`,
            //     updated: `${this.unionEntityAdapter.singular}Updated`,
            //     deleted: `${this.unionEntityAdapter.singular}Deleted`,
            //     relationship_deleted: `${this.unionEntityAdapter.singular}RelationshipDeleted`,
            //     relationship_created: `${this.unionEntityAdapter.singular}RelationshipCreated`,
            // },
        };
    }
}
