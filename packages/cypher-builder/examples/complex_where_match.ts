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

// MATCH (this1)-[this0:ACTED_IN]->(this2:`Person`)
// WHERE (this2.name = $param0 AND (this1.year = $param1 OR this1.year = $param2))
// RETURN this1.title

const movieNode = new Cypher.Node({
    labels: ["Movie"],
});
const personNode = new Cypher.Node({
    labels: ["Person"],
});

const actedInRelationship = movieNode.relatedTo(personNode).withType("ACTED_IN");

const matchQuery = new Cypher.Match(
    actedInRelationship.pattern({
        source: { labels: false },
    })
)
    .where(
        Cypher.and(
            Cypher.eq(personNode.property("name"), new Cypher.Param("Keanu Reeves")),
            Cypher.or(
                Cypher.eq(movieNode.property("year"), new Cypher.Param(1999)),
                Cypher.eq(movieNode.property("year"), new Cypher.Param(2000))
            )
        )
    )
    .return(movieNode.property("title"));

const { cypher, params } = matchQuery.build();

console.log("Cypher");
console.log(cypher);
console.log("----");
console.log("Params", params);
