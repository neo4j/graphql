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

import Cypher from "@neo4j/cypher-builder";
import type { Attribute } from "../attribute/Attribute";
import type { ConcreteEntity } from "../entity/ConcreteEntity";
import type { Entity } from "../entity/Entity";

class AuthorizationAnnotation<T extends ConcreteEntity> { // @authorization
    private filter?: AuthorizationFilterRule[]; //UserAuthorizationFilterRule
    private subscriptionFilter?: SubscriptionFilter; 
    private validate?: Validate;

    constructor({
        filter,
        subscriptionFilter,
        validate,
    }: {
        filter?: AuthorizationFilterRule[];
        subscriptionFilter?: SubscriptionFilter; //
        validate?: AuthorizationValidateFilters;
    }) {
        this.filter = filter;
        this.subscriptionFilter = subscriptionFilter;
        this.validate = validate;
    }
}

const AUTHORIZATION_OPERATION = ["READ", "UPDATE", "DELETE", "CREATE_RELATIONSHIP", "DELETE_RELATIONSHIP"] as const;
type AuthorizationFilterOperation = keyof typeof AUTHORIZATION_OPERATION;

class AuthorizationFilterRule { // UserAuthorizationFilterRule
    operations: AuthorizationFilterOperation[]; // AuthorizationFilterOperation
    requireAuthentication: boolean; 
    where: AuthorizationFilterWhere; // UserAuthorizationWhere

    constructor({
        operations,
        requireAuthentication,
        where,
    }: {
        operations: AuthorizationFilterOperation[];
        requireAuthentication: boolean;
        where: AuthorizationFilterWhere;
    }) {
        this.operations = operations;
        this.requireAuthentication = requireAuthentication;
        this.where = where;
    }
}

class AuthorizationFilterWhere {
    jwtPayload?: Record<string, any>; // TODO could be this undefined? //JWTPayloadWhere
    node?: Record<string, any>; // TODO still need to be defined, could be this undefined? // UserWhere
    
    constructor({ jwtPayload, node }: { jwtPayload: Record<string, any>, node: Record<string, any> }) {
        this.jwtPayload = jwtPayload;
        this.node = node;
    }
}



// 

/**
query {
  userConnection(where: { // with auth an Entity filter is all the time present
    posts: {
      some: {
        edges: {
          node: {
            title: {
              contains: "wonderful"
            }
          }
          fields: {
            timestamp: { gt: 32918083 }
          }
       }}}
  })
}

*/

// [movie1, movie2]



type ParsedJWTSchema = Record<string, any>;

interface JWTPayloadPredicate extends LogicalPredicate<JWTPayloadPredicate>, ParsedJWTSchema {}

interface EntityWhere {
    id: StringPredicate;
    name: StringPredicate;
}

interface SubscriptionFilter {}

interface AuthorizationValidateFilters {
    pre: AuthorizationFilterRule[];
    post: AuthorizationFilterRule[];
}



// OperationTree classes

interface StringPredicate extends LogicalPredicate<StringPredicate> {
    equals?: string;
    in?: string;
    matches?: string;
    contains?: string;
    startsWith?: string;
    endsWith?: string;
}

interface ListPredicate<T> extends LogicalPredicate<ListPredicate<T>> {
    all?: T;
    some?: T;
    single?: T;
}

type LogicalPredicate<T> = {
    OR?: [T];
    AND?: [T];
    NOT?: T;
};

interface Predicate {
    getCypherPredicate(): Cypher.Predicate;
}

class EqualsPredicate implements Predicate {
    predicate: Cypher.Predicate;

    constructor(left, right) {
        this.predicate = Cypher.eq(left, right); // left = this0.id
    }
}

class EntityPredicate implements Predicate {
    nodeRef: Cypher.Node; // maybe is not needed
    predicates: Predicate[];
    constructor(nodeRef: Cypher.Node, predicates: Predicate[]) {
        this.nodeRef = nodeRef;
        this.predicates = predicates;
    }

    getCypherPredicate(): Cypher.Predicate {
        return Cypher.and();//Cypher.and(utils.mergePredicate(this.predicates.map(predicate => predicate.getCypherPredicate()));
    }
}