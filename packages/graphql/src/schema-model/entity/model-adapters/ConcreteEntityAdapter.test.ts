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
import { ConcreteEntityAdapter } from "./ConcreteEntityAdapter";
import { AttributeAdapter } from "../../attribute/model-adapters/AttributeAdapter";
import { CypherAnnotation } from "../../annotation/CypherAnnotation";
import { UniqueAnnotation } from "../../annotation/UniqueAnnotation";

describe("ConcreteEntityAdapter", () => {
    let userModel: ConcreteEntityAdapter;
    let userId: AttributeAdapter;
    let userName: AttributeAdapter;
    let closestUser: AttributeAdapter;

    beforeAll(() => {
        const idAttribute = new Attribute({
            name: "id",
            annotations: [new UniqueAnnotation({ constraintName: "User_id_unique" })],
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

        userModel = new ConcreteEntityAdapter(userEntity);
        userId = userModel.attributes.get("id") as AttributeAdapter;
        userName = userModel.attributes.get("name") as AttributeAdapter;
        closestUser = userModel.attributes.get("closestUser") as AttributeAdapter;
    });

    test("should generate a valid ConcreteEntityAdapter model", () => {
        expect(userModel).toBeDefined();
        expect(userModel).toBeInstanceOf(ConcreteEntityAdapter);
        expect(userModel.name).toBe("User");
        expect(userModel.labels).toEqual(new Set(["User"]));
        expect(userModel.attributes.size).toBe(3);
        expect(userModel.relationships.size).toBe(0);
        expect(userId).toBeDefined();
        expect(userId).toBeInstanceOf(AttributeAdapter);
        expect(userName).toBeDefined();
        expect(userName).toBeInstanceOf(AttributeAdapter);
        expect(closestUser).toBeDefined();
        expect(closestUser).toBeInstanceOf(AttributeAdapter);
    });

    test("should return the correct mutable fields, (Cypher fields are removed)", () => {
        expect(userModel.mutableFields).toHaveLength(2);
        expect(userModel.mutableFields).toEqual([userId, userName]);
    });

    test("should return the correct labels", () => {
        expect(userModel.getAllLabels()).toStrictEqual(["User"]);
        expect(userModel.getMainLabel()).toBe("User");
    });

    test("should return the correct unique fields", () => {
        expect(userModel.uniqueFields).toHaveLength(1);
        expect(userModel.uniqueFields).toStrictEqual([userId]);
    });

    test("should return the correct singular name", () => {
        expect(userModel.singular).toBe("user");
    });

    test("should return the correct plural name", () => {
        expect(userModel.plural).toBe("users");
    });

    describe("ConcreteEntityOperations", () => {
        test("should construct a valid ConcreteEntityOperations", () => {
            expect(userModel.operations).toBeDefined();
        });

        test("should return the correct rootTypeFieldNames", () => {
            expect(userModel.operations.rootTypeFieldNames).toStrictEqual({
                aggregate: "usersAggregate",
                create: "createUsers",
                delete: "deleteUsers",
                read: "users",
                subscribe: {
                    created: "userCreated",
                    deleted: "userDeleted",
                    relationship_created: "userRelationshipCreated",
                    relationship_deleted: "userRelationshipDeleted",
                    updated: "userUpdated",
                },
                update: "updateUsers",
            });
        });

        // TODO: add tests for all the other operations if we keep them
    });
});
