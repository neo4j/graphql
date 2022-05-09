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

import React, { Fragment, useContext, useState } from "react";
import { GraphQLSchema } from "graphql";
import { HeroIcon } from "@neo4j-ndl/react";
// @ts-ignore - SVG import
import ArrowLeft from "../../assets/arrow-left.svg";
import { Screen, ScreenContext } from "../../contexts/screen";
import { DocExplorer } from "../EditorView/docexplorer";
import { Resources } from "./Resources";

interface Props {
    onClickClose: () => void;
    schema?: GraphQLSchema;
}

const CannyFeedbackButton = (): JSX.Element => {
    return (
        <a
            data-test-help-drawer-canny-button
            className="flex justify-start items-center"
            href="https://neo4j-graphql.canny.io/neo4j-graphql-toolbox"
            target="_blank"
        >
            <HeroIcon className="h-6 w-6 mr-2" type="outline" iconName="ChatIcon" />
            <p className="p-0 m-0">Send feedback</p>
        </a>
    );
};

const SchemaDocTile = ({ setShowDocs }: { setShowDocs: Function }): JSX.Element => {
    return (
        <div className="pb-8">
            <div
                data-test-help-drawer-schema-doc-tile
                className="background-help-card p-6 rounded-2xl cursor-pointer"
                onClick={() => setShowDocs(true)}
            >
                <span className="h6">Schema documentation</span>
                <p>Documentation of your current schema</p>
            </div>
        </div>
    );
};

const DocExplorerComponent = ({ schema, onClickClose, onClickBack }): JSX.Element => {
    return (
        <DocExplorer
            schema={schema}
            closeButton={
                <button
                    data-test-help-drawer-doc-explorer-close-button
                    className="docExplorerCloseIcon"
                    onClick={onClickClose}
                    aria-label="Close Documentation Explorer"
                >
                    {"\u2715"}
                </button>
            }
            titleBarBackButton={
                <button
                    className="docExplorerCloseIcon"
                    onClick={onClickBack}
                    aria-label="Back to Help drawer"
                    data-test-help-drawer-doc-explorer-back-button
                >
                    <img src={ArrowLeft} alt="arrow left" className="inline w-5 h-5" />
                </button>
            }
        />
    );
};

export const HelpDrawer = ({ onClickClose, schema }: Props) => {
    const screen = useContext(ScreenContext);
    const [showDocs, setShowDocs] = useState(false);

    return (
        <div className="p-6 w-full" data-test-help-drawer>
            {!showDocs ? (
                <div className="pb-6 flex justify-between items-center" data-test-help-drawer-title>
                    <React.Fragment>
                        <span className="h5">Help &#38; learn</span>
                        <span className="text-lg cursor-pointer" data-test-help-drawer-close onClick={onClickClose}>
                            {"\u2715"}
                        </span>
                    </React.Fragment>
                </div>
            ) : null}
            <Fragment>
                {screen.view === Screen.TYPEDEFS ? (
                    <Resources showSchemaView={true} />
                ) : (
                    <React.Fragment>
                        {showDocs ? (
                            <DocExplorerComponent
                                schema={schema}
                                onClickClose={onClickClose}
                                onClickBack={() => setShowDocs(false)}
                            />
                        ) : (
                            <React.Fragment>
                                <SchemaDocTile setShowDocs={setShowDocs} />
                                <Resources showSchemaView={false} />
                            </React.Fragment>
                        )}
                    </React.Fragment>
                )}

                {!showDocs ? (
                    <div className="absolute bottom-8 right-28 n-text-primary-40 font-bold text-sm">
                        <CannyFeedbackButton />
                    </div>
                ) : null}
            </Fragment>
        </div>
    );
};
