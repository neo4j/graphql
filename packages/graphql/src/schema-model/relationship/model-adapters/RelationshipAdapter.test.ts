import { Attribute } from "../../attribute/Attribute";
import { GraphQLBuiltInScalarType, ScalarType } from "../../attribute/AttributeType";
import { UniqueAnnotation } from "../../annotation/UniqueAnnotation";
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
            annotations: [new UniqueAnnotation({ constraintName: "User_id_unique" })],
            type: new ScalarType(GraphQLBuiltInScalarType.ID, true),
        });

        const userName = new Attribute({
            name: "name",
            annotations: [],
            type: new ScalarType(GraphQLBuiltInScalarType.String, true),
        });

        const accountId = new Attribute({
            name: "id",
            annotations: [new UniqueAnnotation({ constraintName: "User_id_unique" })],
            type: new ScalarType(GraphQLBuiltInScalarType.ID, true),
        });

        const accountUsername = new Attribute({
            name: "username",
            annotations: [],
            type: new ScalarType(GraphQLBuiltInScalarType.String, true),
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
            annotations: [],
            type: new ScalarType(GraphQLBuiltInScalarType.String, true),
        });

        relationship = new Relationship({
            name: "accounts",
            type: "HAS_ACCOUNT",
            source: userEntity,
            target: accountEntity,
            direction: "OUT",
            attributes: [accountAlias],
            queryDirection: "DEFAULT_DIRECTED",
            nestedOperations: ["CREATE", "UPDATE", "DELETE", "CONNECT", "DISCONNECT", "CONNECT_OR_CREATE"],
            aggregate: false,
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
        expect(relationshipAdapter?.connectionFieldTypename).toBe("UserAccountsConnection");
    });

    test("should generate a valid relationshipFieldTypename", () => {
        const relationshipAdapter = userAdapter.relationships.get("accounts");
        expect(relationshipAdapter?.relationshipFieldTypename).toBe("UserAccountsRelationship");
    });
});
