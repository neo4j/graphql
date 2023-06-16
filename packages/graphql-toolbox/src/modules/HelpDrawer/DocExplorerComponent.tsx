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

import { DocExplorer, ExplorerContextProvider, SchemaContextProvider } from "@graphiql/react";
import { createGraphiQLFetcher } from "@graphiql/toolkit";
import classNames from "classnames";
import type { GraphQLSchema } from "graphql";

// @ts-ignore - SVG import
import ArrowLeft from "../../assets/arrow-left.svg";

interface Props {
    onClickClose: () => void;
    onClickBack?: () => void;
    isEmbedded?: boolean;
    schema?: GraphQLSchema;
}

export const DocExplorerComponent = ({ schema, isEmbedded = true, onClickClose, onClickBack }: Props): JSX.Element => {
    const dummyFetcher = createGraphiQLFetcher({
        url: "empty",
    });

    return (
        <div className={classNames("overflow-y-auto", isEmbedded ? "h-full" : "h-[calc(100%-3rem)] m-4")}>
            {isEmbedded ? (
                <div className="flex items-center justify-between mb-4">
                    <button data-test-doc-explorer-back-button aria-label="Back to Help drawer" onClick={onClickBack}>
                        <img src={ArrowLeft} alt="arrow left" className="inline w-5 h-5 text-lg cursor-pointer" />
                    </button>
                    <button
                        data-test-doc-explorer-close-button
                        aria-label="Close Help drawer"
                        className="text-lg"
                        onClick={onClickClose}
                    >
                        {"\u2715"}
                    </button>
                </div>
            ) : null}
            {/* TODO: Move SchemaContextProvider closer to root (Main.tsx) in the future! */}
            <SchemaContextProvider schema={schema} fetcher={dummyFetcher}>
                <ExplorerContextProvider>
                    <div className="graphiql-container">
                        <DocExplorer />
                    </div>
                </ExplorerContextProvider>
            </SchemaContextProvider>
        </div>
    );
};
