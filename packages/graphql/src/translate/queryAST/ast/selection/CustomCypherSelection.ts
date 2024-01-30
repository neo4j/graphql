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
import { QueryASTContext } from "../QueryASTContext";
import { EntitySelection, type SelectionClause } from "./EntitySelection";
import { createNodeFromEntity } from "../../utils/create-node-from-entity";

import type { AttributeAdapter } from "../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { EntityAdapter } from "../../../../schema-model/entity/EntityAdapter";
import type { CypherAnnotation } from "../../../../schema-model/annotation/CypherAnnotation";
import { replaceArgumentsInStatement } from "../../utils/replace-arguments-in-statement";

export class CustomCypherSelection extends EntitySelection {
    private operationField: AttributeAdapter;
    private target?: EntityAdapter;
    private alias?: string;
    private rawArguments: Record<string, any>;
    private cypherAnnotation: CypherAnnotation;

    constructor({
        operationField,
        target,
        alias,
        rawArguments = {},
    }: {
        operationField: AttributeAdapter;
        target?: EntityAdapter;
        alias?: string;
        rawArguments: Record<string, any>;
    }) {
        super();
        this.operationField = operationField;
        this.target = target;
        this.alias = alias;
        this.rawArguments = rawArguments;
        if (!this.operationField.annotations.cypher) {
            throw new Error("Missing Cypher Annotation on Cypher field");
        }
        this.cypherAnnotation = this.operationField.annotations.cypher;
    }

    public apply(context: QueryASTContext): {
        nestedContext: QueryASTContext<Cypher.Node>;
        selection: SelectionClause;
    } {
        const node = this.target
            ? createNodeFromEntity(this.target, context.neo4jGraphQLContext, this.alias)
            : new Cypher.Node();

        const extraParams: Record<string, any> = {};

        if (this.cypherAnnotation.statement.includes("$jwt") && context.neo4jGraphQLContext.authorization.jwtParam) {
            extraParams.jwt = context.neo4jGraphQLContext.authorization.jwtParam.value;
        }

        const returnVariable = new Cypher.NamedVariable(this.cypherAnnotation.columnName);

        const statementCypherQuery = new Cypher.Raw((env) => {
            const statement = replaceArgumentsInStatement({
                env,
                definedArguments: this.operationField.args,
                rawArguments: this.rawArguments,
                statement: this.cypherAnnotation.statement,
            });

            return [statement, extraParams];
        });

        const statementSubquery = new Cypher.Call(statementCypherQuery);

        const thisVariable = new Cypher.NamedVariable("this");

        let selection: Cypher.With;
        const unwindVariable = new Cypher.Variable();
        if (this.operationField.typeHelper.isList() && this.operationField.typeHelper.isScalar()) {
            selection = statementSubquery.unwind([returnVariable, unwindVariable]).with([unwindVariable, thisVariable]);
        } else {
            selection = statementSubquery.with([returnVariable, thisVariable]);
        }
        return {
            selection,
            nestedContext: new QueryASTContext({
                target: node,
                neo4jGraphQLContext: context.neo4jGraphQLContext,
                returnVariable: context.returnVariable,
                env: context.env,
                shouldCollect: context.shouldCollect,
            }),
        };
    }
}
