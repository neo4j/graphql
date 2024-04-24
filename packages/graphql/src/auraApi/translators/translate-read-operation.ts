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

const debug = Debug(DEBUG_TRANSLATE);

export function translateReadOperation({
    context,
    entity,
}: {
    context: Neo4jGraphQLTranslationContext;
    entity: ConcreteEntity;
}): Cypher.CypherResult {
    return {
        cypher: "",
        params: {},
    };
    // const { resolveTree } = context;
    // const operationsTreeFactory = new QueryASTFactory(context.schemaModel);
    // const operationsTree = operationsTreeFactory.createQueryAST({
    //     resolveTree,
    //     entityAdapter,
    //     context,
    //     varName,
    // });
    // debug(operationsTree.print());
    // const clause = operationsTree.build(context);
    // return clause.build();
}
