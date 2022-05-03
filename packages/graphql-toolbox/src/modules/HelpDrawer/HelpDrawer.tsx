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
import { HeroIcon } from "@neo4j-ndl/react";
import React, { Fragment, useContext, useState } from "react";
// @ts-ignore - SVG import
import ArrowLeft from "../../assets/arrow-left.svg";
import { Screen, ScreenContext } from "../../contexts/screen";
import { DocExplorer } from "../EditorView/docexplorer";
import { Links, ResourceListBlock } from "./ResourceListBlock";

// const LibraryDocShortcuts = (): JSX.Element => {
//     const libDocumentationLinks = [
//         {
//             link: "https://neo4j.com/docs/graphql-manual/current/type-definitions/",
//             label: "Type Definitions",
//         },
//         {
//             link: "https://neo4j.com/docs/graphql-manual/current/queries/",
//             label: "Example Queries",
//         },
//         {
//             link: "https://neo4j.com/docs/graphql-manual/current/directives/",
//             label: "Directives",
//         },
//         {
//             link: "https://neo4j.com/docs/graphql-manual/current/filtering/",
//             label: "Filtering",
//         },
//     ];

//     return (
//         <div className="pb-8 grid grid-cols-2 gap-2">
//             {Object.values(libDocumentationLinks).map((res) => (
//                 <a key={res.link} href={res.link} target="_blank">
//                     <div className="background-dark-help-card p-4 rounded-2xl cursor-pointer">
//                         <span className="font-bold">{res.label}</span>
//                     </div>
//                 </a>
//             ))}
//         </div>
//     );
// };

const SchemaDocShortcuts = ({ setShowDocs }: { setShowDocs: Function }): JSX.Element => {
    return (
        <div className="pb-8">
            <div className="background-help-card p-6 rounded-2xl cursor-pointer" onClick={() => setShowDocs(true)}>
                <span className="h6">Schema documentation</span>
                <p>Documentation of your current schema</p>
            </div>
        </div>
    );
};

const Reses = () => {
    const linksResources: Links[] = [
        {
            href: "https://neo4j.com/docs/graphql-manual/current/",
            iconName: "DocumentTextIcon",
            label: "Documentation",
        },
        {
            href: "https://discord.com/channels/787399249741479977/818578492723036210",
            iconName: "ChatAlt2Icon",
            label: "Community",
        },
        {
            href: "https://neo4j.com/graphacademy/training-graphql-apis/enrollment/",
            iconName: "AcademicCapIcon",
            label: "Neo4j Graph Academy",
        },
    ];
    const linksGithub: Links[] = [
        {
            href: "https://github.com/neo4j/graphql",
            iconName: "DocumentTextIcon",
            label: "Github repository",
        },
        {
            href: "https://github.com/neo4j/graphql/issues",
            iconName: "SpeakerphoneIcon",
            label: "Issue tracker",
        },
    ];
    const linksDocumentation: Links[] = [
        {
            href: "https://neo4j.com/docs/graphql-manual/current/type-definitions/",
            iconName: "DocumentTextIcon",
            label: "Type definitions",
        },
        {
            href: "https://neo4j.com/docs/graphql-manual/current/queries/",
            iconName: "VariableIcon",
            label: "Example queries",
        },
        {
            href: "https://neo4j.com/docs/graphql-manual/current/directives/",
            iconName: "AtSymbolIcon",
            label: "Directives",
        },
        {
            href: "https://neo4j.com/docs/graphql-manual/current/filtering/",
            iconName: "FilterIcon",
            label: "Filtering",
        },
    ];
    return (
        <Fragment>
            <ResourceListBlock listBlockTitle="Documentation" links={linksDocumentation} />
            <hr className="mb-3" />
            <ResourceListBlock listBlockTitle="Github" links={linksGithub} />
            <hr className="mb-3" />
            <ResourceListBlock listBlockTitle="Resources" links={linksResources} />
        </Fragment>
    );
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

interface Props {
    onClickClose: () => void;
    schema?: GraphQLSchema;
}

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
                    <React.Fragment>
                        <Reses />
                    </React.Fragment>
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
                                <SchemaDocShortcuts setShowDocs={setShowDocs} />
                                <Reses />
                            </React.Fragment>
                        )}
                    </React.Fragment>
                )}

                <div className="absolute bottom-4 right-28 text-primaryBlue font-bold">
                    <a
                        className="flex justify-start items-center"
                        href="https://neo4j-graphql.canny.io/neo4j-graphql-toolbox"
                        target="_blank"
                    >
                        <HeroIcon className="h-7 w-7 mr-2" type="outline" iconName="ChatIcon" />
                        <p className="p-0 m-0">Send feedback</p>
                    </a>
                </div>
            </div>
        </div>
    );
};
