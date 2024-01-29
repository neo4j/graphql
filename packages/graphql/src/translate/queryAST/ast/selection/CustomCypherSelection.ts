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
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { QueryASTContext } from "../QueryASTContext";
import { EntitySelection, type SelectionClause } from "./EntitySelection";
import { createNodeFromEntity } from "../../utils/create-node-from-entity";
import type { UnionEntityAdapter } from "../../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { AttributeAdapter } from "../../../../schema-model/attribute/model-adapters/AttributeAdapter";

export class CustomCypherSelection extends EntitySelection {
    private operationField: AttributeAdapter;
    private target: ConcreteEntityAdapter | UnionEntityAdapter | undefined;
    private alias?: string;
    private rawArguments: Record<string, any>;

    constructor({
        operationField,
        target,
        alias,
        rawArguments = {},
    }: {
        operationField: AttributeAdapter;
        target?: ConcreteEntityAdapter | UnionEntityAdapter;
        alias?: string;
        rawArguments: Record<string, any>;
    }) {
        super();
        this.operationField = operationField;
        this.target = target;
        this.alias = alias;
        this.rawArguments = rawArguments;
    }

    public apply(context: QueryASTContext): {
        nestedContext: QueryASTContext<Cypher.Node>;
        selection: SelectionClause;
    } {
        const node = this.target
            ? createNodeFromEntity(this.target, context.neo4jGraphQLContext, this.alias)
            : new Cypher.Node();
        const cypherAnnotation = this.operationField.annotations.cypher;
        if (!cypherAnnotation) {
            throw new Error("Missing Cypher Annotation on Cypher field");
        }
        const extraParams: Record<string, any> = {};

        if (cypherAnnotation.statement.includes("$jwt") && context.neo4jGraphQLContext.authorization.jwtParam) {
            extraParams.jwt = context.neo4jGraphQLContext.authorization.jwtParam.value;
        }

        const returnVariable = new Cypher.NamedVariable(cypherAnnotation.columnName);

        const statementCypherQuery = new Cypher.Raw((env) => {
            const statement = this.replaceArgumentsInStatement({
                env,
                rawArguments: this.rawArguments,
                statement: cypherAnnotation.statement,
            });

            return [statement, extraParams];
        });

        const statementSubquery = new Cypher.Call(statementCypherQuery).innerWith("*");
        const res = new Cypher.NamedVariable("res");
        let selection;
        if (this.operationField.typeHelper.isList()) {
            selection = statementSubquery.unwind([returnVariable, res]).with([res, new Cypher.NamedVariable("this")]);
        } else {
            selection = statementSubquery.with([returnVariable, new Cypher.NamedVariable("this")]);
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

    private replaceArgumentsInStatement({
        env,
        rawArguments,
        statement,
    }: {
        env: Cypher.Environment;
        rawArguments: Record<string, any>;
        statement: string;
    }): string {
        let cypherStatement = statement;
        this.operationField.args.forEach((arg) => {
            const value = rawArguments[arg.name];
            if (value) {
                const paramName = new Cypher.Param(value).getCypher(env);
                cypherStatement = cypherStatement.replaceAll(`$${arg.name}`, paramName);
            } else {
                cypherStatement = cypherStatement.replaceAll(`$${arg.name}`, "NULL");
            }
        });

        return cypherStatement;
    }
}
