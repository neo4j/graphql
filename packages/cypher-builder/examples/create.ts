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

// CREATE (this0:`Movie`)
// SET
//     this0.title = $param0
// CREATE (this1:`Movie`)
// SET
//     this1.title = $param0

const titleParam = new Cypher.Param("The Matrix");

const movie1 = new Cypher.Node({
    labels: ["Movie"],
});

const movie2 = new Cypher.Node({
    labels: ["Movie"],
});

// Note that both nodes share the same param
const create1 = new Cypher.Create(movie1).set([movie1.property("title"), titleParam]);
const create2 = new Cypher.Create(movie2).set([movie2.property("title"), titleParam]);

const { cypher, params } = Cypher.concat(create1, create2).build();

console.log("Cypher");
console.log(cypher);
console.log("----");
console.log("Params", params);
