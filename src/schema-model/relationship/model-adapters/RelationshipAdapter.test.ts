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

import { SelectableAnnotation } from "../../annotation/SelectableAnnotation";
import { UniqueAnnotation } from "../../annotation/UniqueAnnotation";
import { Attribute } from "../../attribute/Attribute";
import { GraphQLBuiltInScalarType, ScalarType } from "../../attribute/AttributeType";
import { ConcreteEntity } from "../../entity/ConcreteEntity";
import { ConcreteEntityAdapter } from "../../entity/model-adapters/ConcreteEntityAdapter";
import { Relationship } from "../Relationship";
import { RelationshipAdapter } from "./RelationshipAdapter";

describe("RelationshipAdapter", () => {
    let userAdapter: ConcreteEntityAdapter;
    let relationship: Relationship;

    beforeAll(() => {
        const userId = new Attribute({
            name: "id",
            annotations: { unique: new UniqueAnnotation({ constraintName: "User_id_unique" }) },
            type: new ScalarType(GraphQLBuiltInScalarType.ID, true),
            args: [],
        });

        const userName = new Attribute({
            name: "name",
            annotations: {},
            type: new ScalarType(GraphQLBuiltInScalarType.String, true),
            args: [],
        });

        const accountId = new Attribute({
            name: "id",
            annotations: { unique: new UniqueAnnotation({ constraintName: "User_id_unique" }) },
            type: new ScalarType(GraphQLBuiltInScalarType.ID, true),
            args: [],
        });

        const accountUsername = new Attribute({
            name: "username",
            annotations: {},
            type: new ScalarType(GraphQLBuiltInScalarType.String, true),
            args: [],
        });

        const userEntity = new ConcreteEntity({
            name: "User",
            labels: ["User"],
            attributes: [userId, userName],
        });

        const accountEntity = new ConcreteEntity({
            name: "Account",
            labels: ["Account"],
            attributes: [accountId, accountUsername],
        });

        const accountAlias = new Attribute({
            name: "accountAlias",
            annotations: {},
            type: new ScalarType(GraphQLBuiltInScalarType.String, true),
            args: [],
        });

        const selectable = new SelectableAnnotation({ onRead: false, onAggregate: true });

        relationship = new Relationship({
            name: "accounts",
            type: "HAS_ACCOUNT",
            args: [],
            source: userEntity,
            target: accountEntity,
            direction: "OUT",
            isList: Boolean(false),
            attributes: [accountAlias],
            queryDirection: "DEFAULT_DIRECTED",
            nestedOperations: ["CREATE", "UPDATE", "DELETE", "CONNECT", "DISCONNECT", "CONNECT_OR_CREATE"],
            aggregate: false,
            description: "",
            annotations: { selectable },
            isNullable: false,
        });
        userEntity.addRelationship(relationship);

        userAdapter = new ConcreteEntityAdapter(userEntity);
    });

    test("should be possible to get a correct instance of a RelationshipAdapter from a ConcreteEntity", () => {
        expect(userAdapter).toBeDefined();
        expect(userAdapter).toBeInstanceOf(ConcreteEntityAdapter);
        expect(userAdapter.relationships.size).toBe(1);
        const relationshipAdapter = userAdapter.relationships.get("accounts");
        expect(relationshipAdapter).toBeDefined();
        expect(relationshipAdapter).toBeInstanceOf(RelationshipAdapter);
        expect(relationshipAdapter?.attributes.size).toBe(1);
        expect(relationshipAdapter?.type).toBe("HAS_ACCOUNT");
        expect(relationshipAdapter?.direction).toBe("OUT");
        expect(relationshipAdapter?.source).toBeInstanceOf(ConcreteEntityAdapter);
        expect(relationshipAdapter?.source.name).toBe("User");
        expect(relationshipAdapter?.target).toBeInstanceOf(ConcreteEntityAdapter);
        expect(relationshipAdapter?.target.name).toBe("Account");
    });

    test("should be possible to get a correct instance of a RelationshipAdapter starting from a Relationship", () => {
        const relationshipAdapter = new RelationshipAdapter(relationship);
        expect(relationshipAdapter).toBeDefined();
        expect(relationshipAdapter).toBeInstanceOf(RelationshipAdapter);
        expect(relationshipAdapter?.attributes.size).toBe(1);
        expect(relationshipAdapter?.type).toBe("HAS_ACCOUNT");
        expect(relationshipAdapter?.direction).toBe("OUT");
        expect(relationshipAdapter?.source).toBeInstanceOf(ConcreteEntityAdapter);
        expect(relationshipAdapter?.source.name).toBe("User");
        expect(relationshipAdapter?.target).toBeInstanceOf(ConcreteEntityAdapter);
        expect(relationshipAdapter?.target.name).toBe("Account");
    });

    test("should generate a valid connectionFieldTypename", () => {
        const relationshipAdapter = userAdapter.relationships.get("accounts");
        expect(relationshipAdapter?.operations.connectionFieldTypename).toBe("UserAccountsConnection");
    });

    test("should generate a valid relationshipFieldTypename", () => {
        const relationshipAdapter = userAdapter.relationships.get("accounts");
        expect(relationshipAdapter?.operations.relationshipFieldTypename).toBe("UserAccountsRelationship");
    });

    test("should parse selectable", () => {
        const relationshipAdapter = userAdapter.relationships.get("accounts");
        expect(relationshipAdapter?.isAggregable()).toBeTrue();
        expect(relationshipAdapter?.isReadable()).toBeFalse();
    });
});
