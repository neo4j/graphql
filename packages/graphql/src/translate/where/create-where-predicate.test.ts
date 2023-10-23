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

import { createWherePredicateNew as createWherePredicate } from "./create-where-predicate";
import { ContextBuilder } from "../../../tests/utils/builders/context-builder";
import { NodeBuilder } from "../../../tests/utils/builders/node-builder";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";
import Cypher from "@neo4j/cypher-builder";
import { CypherAnnotation } from "../../schema-model/annotation/CypherAnnotation";
import { UniqueAnnotation } from "../../schema-model/annotation/UniqueAnnotation";
import { Attribute } from "../../schema-model/attribute/Attribute";
import { ScalarType, GraphQLBuiltInScalarType } from "../../schema-model/attribute/AttributeType";
import { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";

describe("createWherePredicate", () => {
    let entityAdapter: ConcreteEntityAdapter;

    beforeAll(() => {
        const idAttribute = new Attribute({
            name: "id",
            annotations: [new UniqueAnnotation({ constraintName: "User_id_unique" })],
            type: new ScalarType(GraphQLBuiltInScalarType.ID, true),
            args: [],
        });

        const nameAttribute = new Attribute({
            name: "name",
            annotations: [],
            type: new ScalarType(GraphQLBuiltInScalarType.String, true),
            args: [],
        });

        const titleAttribute = new Attribute({
            name: "title",
            annotations: [],
            type: new ScalarType(GraphQLBuiltInScalarType.String, true),
            args: [],
        });

        const userEntity = new ConcreteEntity({
            name: "User",
            labels: ["User"],
            attributes: [idAttribute, nameAttribute, titleAttribute],
        });

        entityAdapter = new ConcreteEntityAdapter(userEntity);
    });
    test("should be a function", () => {
        expect(createWherePredicate).toBeInstanceOf(Function);
    });

    test.only("should return the correct clause with 1 param", () => {
        const whereInput = {
            title: "some title",
        };

        const varName = new Cypher.NamedNode("this");

        const context = new ContextBuilder({}).instance();

        const { predicate: RawPredicate, preComputedSubqueries: RawPreComputedSubqueries } = createWherePredicate({
            whereInput,
            targetElement: varName,
            entity: entityAdapter,
            context,
        });

        expectIsDefined(RawPredicate);
       // expectIsDefined(RawPreComputedSubqueries);
        const predicate = toCypherResult(RawPredicate);
        //const preComputedSubqueries = toCypherResult(RawPreComputedSubqueries);

        expect(predicate.cypher).toMatchInlineSnapshot(`"this.title = $param0"`);
        expect(predicate.params).toMatchInlineSnapshot(`
            Object {
              "param0": "some title",
            }
        `);
/* 
        expect(preComputedSubqueries.cypher).toMatchInlineSnapshot();
        expect(preComputedSubqueries.params).toMatchInlineSnapshot(); */
    });

    test.skip("should return a clause with the correct idField when using the `id` where argument on a global node", () => {
        const varName = new Cypher.NamedNode("this");

        const node = new NodeBuilder({
            name: "Movie",
            primitiveFields: [],
            isGlobalNode: true,
            globalIdField: "title",
        }).instance();

        const whereInput = {
            id: node.toGlobalId("some title"),
        };

        const { predicate: RawPredicate} = createWherePredicate({
            whereInput,
            targetElement: varName,
            entity: entityAdapter,
            context: {} as Neo4jGraphQLTranslationContext,
        });
        expectIsDefined(RawPredicate);
      //  expectIsDefined(RawPreComputedSubqueries);
        const predicate = toCypherResult(RawPredicate);

        expect(predicate.cypher).toMatchInlineSnapshot(`"this.title = $param0"`);
        expect(predicate.params).toMatchInlineSnapshot(`
            Object {
              "param0": "some title",
            }
        `);
    });
});

// Temporary helper move out of this file if it is needed elsewhere
function expectIsDefined<T>(value: T): asserts value is NonNullable<T> {
    expect(value).toBeDefined();
}

// Temporary helper move out of this file if it is needed elsewhere
function toCypherResult(expr: Cypher.Expr | Cypher.Clause): Cypher.CypherResult {
    return new Cypher.RawCypher((env) => expr.getCypher(env)).build();
}
