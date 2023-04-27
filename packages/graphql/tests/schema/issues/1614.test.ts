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

import { gql } from "graphql-tag";
import { validateSchema } from "graphql";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/1614", () => {
    test("should include enumFields on relationships", async () => {
        const typeDefs = gql`
            enum CrewPositionType {
                BoomOperator
                Gaffer
                KeyGrip
            }

            interface CrewPosition {
                position: CrewPositionType
            }

            type Movie {
                name: String!
            }

            type CrewMember {
                movies: Movie! @relationship(type: "WORKED_ON", direction: OUT, properties: "CrewPosition")
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const schema = await neoSchema.getSchema();
        expect(schema).toBeDefined();

        const errors = validateSchema(schema);
        expect(errors).toEqual([]);

        const relationship = neoSchema.relationships.find((r) => r.name === "CrewMemberMoviesRelationship");
        expect(relationship).toBeDefined();
        expect(relationship?.enumFields?.length).toBe(1);
        expect(relationship?.properties).toBe("CrewPosition");

        const enumField = relationship?.enumFields[0];
        expect(enumField?.kind).toBe("Enum");
        expect(enumField?.fieldName).toBe("position");
        expect(enumField?.typeMeta?.name).toBe("CrewPositionType");
    });
});
