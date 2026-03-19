/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import { QueryASTContext } from "../QueryASTContext";
import { EntitySelection, type SelectionClause } from "./EntitySelection";

import type { CypherAnnotation } from "../../../../schema-model/annotation/CypherAnnotation";
import type { AttributeAdapter } from "../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import { replaceArgumentsInStatement } from "../../utils/replace-arguments-in-statement";

/** Variable exposed to the user in their custom cypher */
const CYPHER_TARGET_VARIABLE = new Cypher.NamedVariable("this");

export class CustomCypherSelection extends EntitySelection {
    private operationField: AttributeAdapter;
    private rawArguments: Record<string, any>;
    private cypherAnnotation: CypherAnnotation;
    private isNested: boolean;
    private attachedTo: "node" | "relationship";

    /**
     *  @param targetRelationship - Should this selector use the relationship variable of the context as "this" target in the Cypher? (use it for edge props)
     */
    constructor({
        operationField,
        rawArguments = {},
        isNested,
        attachedTo = "node",
    }: {
        operationField: AttributeAdapter;
        rawArguments: Record<string, any>;
        isNested: boolean;
        attachedTo?: "node" | "relationship";
    }) {
        super();
        this.operationField = operationField;
        this.rawArguments = rawArguments;
        this.isNested = isNested;
        if (!this.operationField.annotations.cypher) {
            throw new Error("Missing Cypher Annotation on Cypher field");
        }
        this.cypherAnnotation = this.operationField.annotations.cypher;
        this.attachedTo = attachedTo;
    }

    public apply(context: QueryASTContext): {
        nestedContext: QueryASTContext<Cypher.Node>;
        selection: SelectionClause;
    } {
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

        const thisVariable = new Cypher.Node();

        let statementSubquery: Cypher.Call;

        const nestedTarget = this.attachedTo === "relationship" ? context.relationship : context.target;
        if (this.isNested && nestedTarget) {
            const aliasTargetToPublicTarget = new Cypher.With([nestedTarget, CYPHER_TARGET_VARIABLE]);
            statementSubquery = new Cypher.Call(Cypher.utils.concat(aliasTargetToPublicTarget, statementCypherQuery), [
                nestedTarget,
            ]);
        } else {
            statementSubquery = new Cypher.Call(statementCypherQuery);
        }

        let selection: Cypher.With;
        const unwindVariable = new Cypher.Variable();
        if (
            this.operationField.typeHelper.isList() &&
            (this.operationField.typeHelper.isScalar() || this.operationField.typeHelper.isSpatial())
        ) {
            selection = statementSubquery.unwind([returnVariable, unwindVariable]).with([unwindVariable, thisVariable]);
        } else {
            selection = statementSubquery.with([returnVariable, thisVariable]);
        }
        return {
            selection,
            nestedContext: new QueryASTContext({
                source: context.target,
                target: thisVariable,
                neo4jGraphQLContext: context.neo4jGraphQLContext,
                returnVariable: thisVariable,
                env: context.env,
                shouldCollect: this.isNested,
            }),
        };
    }
}
