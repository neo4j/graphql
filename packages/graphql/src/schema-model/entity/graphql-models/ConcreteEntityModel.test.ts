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

import { ConcreteEntity } from "../ConcreteEntity";
import { Attribute } from "../../attribute/Attribute";
import { GraphQLBuiltInScalarType, ScalarType } from "../../attribute/AttributeType";
import { ConcreteEntityModel } from "./ConcreteEntityModel";
import { AttributeModel } from "../../attribute/graphql-models/AttributeModel";
import { CypherAnnotation } from "../../annotation/CypherAnnotation";

describe("ConcreteEntityModel", () => {
    let userModel: ConcreteEntityModel;
    let userId: AttributeModel;
    let userName: AttributeModel;
    let closestUser: AttributeModel;

    beforeAll(() => {
        const idAttribute = new Attribute({
            name: "id",
            annotations: [],
            type: new ScalarType(GraphQLBuiltInScalarType.ID, true),
        });

        const nameAttribute = new Attribute({
            name: "name",
            annotations: [],
            type: new ScalarType(GraphQLBuiltInScalarType.String, true),
        });

        const closestUserAttribute = new Attribute({
            name: "closestUser",
            annotations: [
                new CypherAnnotation({
                    statement: "MATCH (this)-[:FRIENDS_WITH]->(closestUser:User) RETURN closestUser",
                    columnName: "closestUser",
                }),
            ],
            type: new ScalarType(GraphQLBuiltInScalarType.String, true),
        });

        const userEntity = new ConcreteEntity({
            name: "User",
            labels: ["User"],
            attributes: [idAttribute, nameAttribute, closestUserAttribute],
        });

        userModel = new ConcreteEntityModel(userEntity);
        userId = userModel.attributes.get("id") as AttributeModel;
        userName = userModel.attributes.get("name") as AttributeModel;
        closestUser = userModel.attributes.get("closestUser") as AttributeModel;
    });

    test("should generate a valid GraphQL model", () => {
        expect(userModel).toBeDefined();
        expect(userModel).toBeInstanceOf(ConcreteEntityModel);
        expect(userModel.name).toBe("User");
        expect(userModel.labels).toEqual(new Set(["User"]));
        expect(userModel.attributes.size).toBe(3);
        expect(userModel.relationships.size).toBe(0);
        expect(userId).toBeDefined();
        expect(userId).toBeInstanceOf(AttributeModel);
        expect(userName).toBeDefined();
        expect(userName).toBeInstanceOf(AttributeModel);
        expect(closestUser).toBeDefined();
        expect(closestUser).toBeInstanceOf(AttributeModel);
    });

    test("should return the correct mutable fields, (Cypher fields are removed)", () => {
        expect(userModel.mutableFields).toHaveLength(2);
        expect(userModel.mutableFields).toEqual([userId, userName]);
    });
});
