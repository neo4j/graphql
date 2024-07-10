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
import { mapLabelsWithContext } from "../../../../schema-model/utils/map-labels-with-context";
import type { Neo4jVectorSettings } from "../../../../types";
import { QueryASTContext } from "../QueryASTContext";
import type { VectorOptions } from "../operations/VectorOperation";
import { EntitySelection, type SelectionClause } from "./EntitySelection";

export class VectorSelection extends EntitySelection {
    private target: ConcreteEntityAdapter;
    private vectorOptions: VectorOptions;

    private scoreVariable: Cypher.Variable;
    private settings?: Neo4jVectorSettings;

    constructor({
        target,
        vectorOptions,
        scoreVariable,
        settings,
    }: {
        target: ConcreteEntityAdapter;
        vectorOptions: VectorOptions;
        scoreVariable: Cypher.Variable;
        settings?: Neo4jVectorSettings;
    }) {
        super();
        this.target = target;
        this.vectorOptions = vectorOptions;
        this.scoreVariable = scoreVariable;
        this.settings = settings;
    }
    public apply(context: QueryASTContext): {
        nestedContext: QueryASTContext<Cypher.Node>;
        selection: SelectionClause;
    } {
        const node = new Cypher.Node();
        const vectorParam = new Cypher.Param(this.vectorOptions.vector);
        const phraseParam = new Cypher.Param(this.vectorOptions.phrase);
        const indexName = new Cypher.Literal(this.vectorOptions.index.indexName);
        let vectorClause: SelectionClause | undefined = undefined;

        // Different cases:
        // 1. Vector index without phrase, where the input is a List of Floats
        if (this.vectorOptions.vector) {
            vectorClause = Cypher.db.index.vector
                .queryNodes(indexName, 4, vectorParam)
                .yield(["node", node], ["score", this.scoreVariable]);
        }

        // 2. Vector index with phrase, where the input is a String, and there is a configured provider. We're going to use
        //    the GenAI plugin for this.
        if (this.vectorOptions.phrase && this.vectorOptions.index.provider) {
            if (!this.settings || !this.settings[this.vectorOptions.index.provider]) {
                throw new Error(
                    `Missing settings for provider ${this.vectorOptions.index.provider}. Please check your configuration.`
                );
            }

            const providerSettings = this.settings[this.vectorOptions.index.provider];
            const asQueryVector = new Cypher.Variable();
            const vectorProcedure = Cypher.db.index.vector.queryNodes(indexName, 4, asQueryVector);

            const encodeFunction = Cypher.genai.vector.encode(
                phraseParam,
                this.vectorOptions.index.provider,
                providerSettings
            );

            vectorClause = new Cypher.With([encodeFunction, asQueryVector])
                .callProcedure(vectorProcedure)
                .yield(["node", node], ["score", this.scoreVariable]);
        }

        // 3. Vector index with phrase, where the input is a String, and there is no configured provider (and there is a callback).
        //    We're going to skip the use of the GenAI plugin for this.

        if (!vectorClause) {
            // This shouldn't occur. Probably requires a refactor so this code path is never reached.
            throw new Error("Unsupported vector index configuration");
        }

        const expectedLabels = mapLabelsWithContext(this.target.getLabels(), context.neo4jGraphQLContext);

        const whereOperators = expectedLabels.map((label) => {
            return Cypher.in(new Cypher.Param(label), Cypher.labels(node));
        });

        vectorClause.where(Cypher.and(...whereOperators));

        return {
            selection: vectorClause,
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
