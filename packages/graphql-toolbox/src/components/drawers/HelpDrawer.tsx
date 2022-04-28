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

import { GraphQLSchema } from "graphql";
import React, { useContext, useState } from "react";
// @ts-ignore - SVG import
import ArrowLeft from "../../assets/arrow-left.svg";
import { Screen, ScreenContext } from "../../contexts/screen";
import { DocExplorer } from "../editor/docexplorer";

interface Props {
    onClickClose: () => void;
    schema?: GraphQLSchema;
}

const Resources = (): JSX.Element => {
    return <div className="pt-6">resources</div>;
};

const DocExplorerWrap = ({ schema, onClickClose, onClickBack }): JSX.Element => {
    return (
        <DocExplorer
            schema={schema}
            closeButton={
                <button
                    className="docExplorerCloseIcon"
                    onClick={onClickClose}
                    aria-label="Close Documentation Explorer"
                >
                    {"\u2715"}
                </button>
            }
            titleBarBackButton={
                <button className="docExplorerCloseIcon" onClick={onClickBack} aria-label="Back to Help drawer">
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
        <div className="p-6 w-full">
            {!showDocs ? (
                <div className="pb-6 flex justify-between items-center">
                    <React.Fragment>
                        <span className="h5">Help &#38; learn</span>
                        <span className="text-lg cursor-pointer" onClick={onClickClose}>
                            {"\u2715"}
                        </span>
                    </React.Fragment>
                </div>
            ) : null}
            <div>
                {screen.view === Screen.TYPEDEFS ? (
                    <Resources />
                ) : (
                    <React.Fragment>
                        {showDocs ? (
                            <DocExplorerWrap
                                schema={schema}
                                onClickClose={onClickClose}
                                onClickBack={() => setShowDocs(false)}
                            />
                        ) : (
                            <React.Fragment>
                                <div className="pt-6">
                                    <div
                                        className="background-help-card p-6 rounded-2xl cursor-pointer"
                                        onClick={() => setShowDocs(true)}
                                    >
                                        <span className="h6">Schema documentation</span>
                                        <p>Documentation of your current schema</p>
                                    </div>
                                </div>

                                <Resources />
                            </React.Fragment>
                        )}
                    </React.Fragment>
                )}
            </div>
        </div>
    );
};
