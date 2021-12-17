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

// Import using commonJS
const { Neo4jGraphQL } = require("@neo4j/graphql");
const { printSchema } = require("graphql");
// Augment schema with simple typeDefs input
const typeDefs = `type Movie{ id: ID!}`;
const neoSchema = new Neo4jGraphQL({ typeDefs });

// A "Movies" query should have been generated
const generatedTypeDefsMatch = /movies/;

// If not, throw to exit process with 1 and include stack trace
if (!generatedTypeDefsMatch.test(printSchema(neoSchema.schema))) {
    throw new Error(`${generatedTypeDefsMatch} was not found in generated typeDefs`);
}
