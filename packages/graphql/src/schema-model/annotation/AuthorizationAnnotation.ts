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

class AuthorizationAnnotation<T extends ConcreteEntity> {
    // @authorization
    private filter?: AuthorizationFilterRule[]; //UserAuthorizationFilterRule
    private validatePre?: AuthorizationFilterRule[]; //UserAuthorizationPreValidateRule
    private validatePost?: AuthorizationFilterRule[]; //UserAuthorizationPostValidateRule
    // TODO:
    // private subscriptionFilter?: SubscriptionFilter;

    constructor({
        filter,
        validatePre,
        validatePost,
    }: {
        filter?: AuthorizationFilterRule[];
        validatePre?: AuthorizationFilterRule[];
        validatePost?: AuthorizationFilterRule[];
    }) {
        this.filter = filter;
        this.validatePre = validatePre;
        this.validatePost = validatePost;
    }
}

const AUTHORIZATION_OPERATION = ["READ", "UPDATE", "DELETE", "CREATE_RELATIONSHIP", "DELETE_RELATIONSHIP"] as const;
type AuthorizationFilterOperation = keyof typeof AUTHORIZATION_OPERATION;

class AuthorizationFilterRule {
    // UserAuthorizationFilterRule
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

    constructor({ jwtPayload, node }: { jwtPayload: Record<string, any>; node: Record<string, any> }) {
        this.jwtPayload = jwtPayload;
        this.node = node;
    }

    // if node --> need Cypher.Node nodeRef
    // if jwtPayload --> is string, no need for nodeRef
}

type ParsedJWTSchema = Record<string, any>;

interface JWTPayloadPredicate extends LogicalPredicate<JWTPayloadPredicate>, ParsedJWTSchema {}

interface EntityWhere {
    id: StringPredicate;
    name: StringPredicate;
}

interface AuthorizationValidateFilters {
    pre: AuthorizationFilterRule[];
    post: AuthorizationFilterRule[];
}

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

// *****************
// *OperationTree classes
// ***************

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

    getCypherPredicate(): Cypher.Predicate {
        return this.predicate;
    }
}

class SomePredicate implements Predicate {
    predicate: Cypher.Predicate;

    constructor(relationshipFilter: RelationshipFilter) {
        this.predicate = new Cypher.Exists(relationshipFilter.poop());
    }

    getCypherPredicate(): Cypher.Predicate {
        return this.predicate;
    }
}

class AndPredicate implements Predicate {
    predicate: Cypher.Predicate;

    constructor(...predicates: [Cypher.Predicate, Cypher.Predicate]) {
        this.predicate = Cypher.and(...predicates);
    }

    getCypherPredicate(): Cypher.Predicate {
        return this.predicate;
    }
}

class EntityPredicate implements Predicate {
    nodeRef: Cypher.Node; // maybe is not needed
    predicates: Predicate[]; // is this array or single value?
    constructor(nodeRef: Cypher.Node, predicates: Predicate[]) {
        this.nodeRef = nodeRef;
        this.predicates = predicates;
    }

    getCypherPredicate(): Cypher.Predicate {
        return this.predicates[0].getCypherPredicate();
        // return Cypher.and(); //Cypher.and(utils.mergePredicate(this.predicates.map(predicate => predicate.getCypherPredicate()));
    }
}

class RelationshipPredicate implements Predicate {
    relationshipRef: Cypher.Relationship; // maybe is not needed
    predicates: Predicate[];
    constructor(relationshipRef: Cypher.Relationship, predicates: Predicate[]) {
        this.relationshipRef = relationshipRef;
        this.predicates = predicates;
    }

    getCypherPredicate(): Cypher.Predicate {
        return Cypher.and(); //Cypher.and(utils.mergePredicate(this.predicates.map(predicate => predicate.getCypherPredicate()));
    }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Filter {}

class EntityFilter implements Filter {
    nodeRef: Cypher.Node;
    predicate: Predicate;

    constructor(nodeRef: Cypher.Node, constructablePredicate: unknown) {
        this.nodeRef = nodeRef;
        this.predicate = new Predicate(constructablePredicate); // build Predicate from constructable
    }

    poop(): Cypher.Predicate {
        //to be composed with Cypher.Match() or Cypher.With()
        return this.predicate.getCypherPredicate();
    }
}

class RelationshipFilter implements Filter {
    relationshipRef: Cypher.Relationship;
    predicate: Predicate;

    constructor(
        relationshipRef: Cypher.Relationship,
        nodePredicate: EntityPredicate,
        relationshipPredicate: RelationshipPredicate
    ) {
        this.relationshipRef = relationshipRef;
        this.predicate = new AndPredicate( // implicit "and"
            nodePredicate.getCypherPredicate(),
            relationshipPredicate.getCypherPredicate()
        );
    }

    poop(): Cypher.Clause {
        //this is a Clause, not a Predicate ??
        return new Cypher.Match(this.relationshipRef).where(this.predicate.getCypherPredicate());
    }
}
