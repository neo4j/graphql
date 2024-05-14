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
import { ReadOperationFactory } from "../queryIRFactory/ReadOperationFactory";
import { parseResolveInfoTree } from "../queryIRFactory/resolve-tree-parser/ResolveTreeParser";

const debug = Debug(DEBUG_TRANSLATE);

export function translateReadOperation({
    context,
    entity,
}: {
    context: Neo4jGraphQLTranslationContext;
    entity: ConcreteEntity;
}): Cypher.CypherResult {
    const readFactory = new ReadOperationFactory(context.schemaModel);

    const parsedTree = parseResolveInfoTree({ resolveTree: context.resolveTree, entity });

    const readOperation = readFactory.createAST({ graphQLTree: parsedTree, entity });
    debug(readOperation.print());
    const results = readOperation.build(context);
    return results.build();
}
