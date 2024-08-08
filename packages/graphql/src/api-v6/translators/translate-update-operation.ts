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

import type Cypher from "@neo4j/cypher-builder";
import Debug from "debug";
import { DEBUG_TRANSLATE } from "../../constants";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";
import { UpdateOperationFactory } from "../queryIRFactory/UpdateOperationFactory";
import type { GraphQLTreeUpdate } from "../queryIRFactory/resolve-tree-parser/graphql-tree/graphql-tree";

const debug = Debug(DEBUG_TRANSLATE);

export function translateUpdateOperation({
    context,
    entity,
    graphQLTreeUpdate,
}: {
    context: Neo4jGraphQLTranslationContext;
    graphQLTreeUpdate: GraphQLTreeUpdate;
    entity: ConcreteEntity;
}): Cypher.CypherResult {
    const createFactory = new UpdateOperationFactory(context.schemaModel);
    const createAST = createFactory.createAST({ graphQLTreeUpdate, entity });
    debug(createAST.print());
    const results = createAST.build(context);
    return results.build();
}
