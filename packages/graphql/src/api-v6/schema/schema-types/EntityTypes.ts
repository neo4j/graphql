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

import type { ObjectTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
import type { EntityTypeNames } from "../../graphQLTypeNames/EntityTypeNames";
import type { SchemaBuilder } from "../SchemaBuilder";
import type { StaticTypes } from "./StaticTypes";

/** This class defines the GraphQL types for an entity */
export abstract class EntityTypes<T extends EntityTypeNames> {
    protected schemaBuilder: SchemaBuilder;
    protected entityTypes: T;
    protected staticTypes: StaticTypes;

    constructor({
        schemaBuilder,
        entityTypes,
        staticTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        staticTypes: StaticTypes;
        entityTypes: T;
    }) {
        this.schemaBuilder = schemaBuilder;
        this.entityTypes = entityTypes;
        this.staticTypes = staticTypes;
    }

    @Memoize()
    public get connectionOperation(): ObjectTypeComposer {
        return this.schemaBuilder.createObjectType(this.entityTypes.connectionOperation, {
            connection: this.connection,
        });
    }

    @Memoize()
    public get connection(): ObjectTypeComposer {
        return this.schemaBuilder.createObjectType(this.entityTypes.connectionType, {
            pageInfo: this.staticTypes.pageInfo,
            edges: [this.edge],
        });
    }

    @Memoize()
    public get edge(): ObjectTypeComposer {
        const fields = {
            node: this.nodeType,
            cursor: "String",
        };

        const properties = this.getEdgeProperties();
        if (properties) {
            fields["properties"] = properties;
        }

        return this.schemaBuilder.createObjectType(this.entityTypes.edgeType, fields);
    }

    protected abstract getEdgeProperties(): ObjectTypeComposer | undefined;
    public abstract get nodeType(): string;
}
