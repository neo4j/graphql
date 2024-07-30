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

import { GraphQLBoolean, GraphQLFloat, GraphQLID, GraphQLInt, GraphQLString } from "graphql";
import type { SchemaComposer } from "graphql-compose";
import { ScalarTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
import {
    GraphQLBigInt,
    GraphQLDate,
    GraphQLDateTime,
    GraphQLDuration,
    GraphQLLocalDateTime,
    GraphQLLocalTime,
    GraphQLTime,
} from "../../graphql/scalars";

export class SchemaBuilderTypes {
    private composer: SchemaComposer;

    constructor(composer: SchemaComposer) {
        this.composer = composer;
    }

    @Memoize()
    public get id(): ScalarTypeComposer {
        return new ScalarTypeComposer(GraphQLID, this.composer);
    }
    @Memoize()
    public get int(): ScalarTypeComposer {
        return new ScalarTypeComposer(GraphQLInt, this.composer);
    }
    @Memoize()
    public get float(): ScalarTypeComposer {
        return new ScalarTypeComposer(GraphQLFloat, this.composer);
    }
    @Memoize()
    public get bigInt(): ScalarTypeComposer {
        return new ScalarTypeComposer(GraphQLBigInt, this.composer);
    }
    @Memoize()
    public get string(): ScalarTypeComposer {
        return new ScalarTypeComposer(GraphQLString, this.composer);
    }
    @Memoize()
    public get boolean(): ScalarTypeComposer {
        return new ScalarTypeComposer(GraphQLBoolean, this.composer);
    }
    @Memoize()
    public get date(): ScalarTypeComposer {
        return new ScalarTypeComposer(GraphQLDate, this.composer);
    }
    @Memoize()
    public get dateTime(): ScalarTypeComposer {
        return new ScalarTypeComposer(GraphQLDateTime, this.composer);
    }
    @Memoize()
    public get localDateTime(): ScalarTypeComposer {
        return new ScalarTypeComposer(GraphQLLocalDateTime, this.composer);
    }
    @Memoize()
    public get time(): ScalarTypeComposer {
        return new ScalarTypeComposer(GraphQLTime, this.composer);
    }
    @Memoize()
    public get localTime(): ScalarTypeComposer {
        return new ScalarTypeComposer(GraphQLLocalTime, this.composer);
    }
    @Memoize()
    public get duration(): ScalarTypeComposer {
        return new ScalarTypeComposer(GraphQLDuration, this.composer);
    }
}
