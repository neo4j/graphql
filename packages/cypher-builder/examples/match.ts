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

import Cypher from "../src";

// MATCH (this1:`Person`)-[this0:ACTED_IN]->(this2:`Movie`)
// WHERE (this1.name = $param0 AND this2.released = $param1)
// RETURN this2.title, this2.released AS year

const movieNode = new Cypher.Node({
    labels: ["Movie"],
});
const personNode = new Cypher.Node({
    labels: ["Person"],
});

const actedInRelationship = movieNode.relatedTo(personNode).withType("ACTED_IN");

const matchQuery = new Cypher.Match(actedInRelationship)
    .where(personNode, { name: new Cypher.Param("Keanu Reeves") })
    .and(movieNode, { released: new Cypher.Param(1999) })
    .return(movieNode.property("title"), [movieNode.property("released"), "year"]);

const { cypher, params } = matchQuery.build();

console.log("Cypher");
console.log(cypher);
console.log("----");
console.log("Params", params);
