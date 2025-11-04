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

import { DirectiveLocation, GraphQLDirective, GraphQLNonNull } from "graphql";
import { ScalarOrEnumType } from "./arguments/scalars/ScalarOrEnum";

export const defaultDirective = new GraphQLDirective({
    name: "default",
    description:
        "Instructs @neo4j/graphql to set the specified value as the default value in the CreateInput type for the object type in which this directive is used.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        value: {
            description:
                "The default value to use. Must be a scalar type and must match the type of the field with which this directive decorates.",
            type: new GraphQLNonNull(ScalarOrEnumType),
        },
    },
});
