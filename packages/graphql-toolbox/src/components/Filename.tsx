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

import { useContext } from "react";

import classNames from "classnames";

// @ts-ignore - SVG Import
import GraphQLIcon from "../assets/graphql-icon.svg";
import { Theme, ThemeContext } from "../contexts/theme";

export enum Extension {
    JSON,
    GQL,
    GRAPHQL,
}

interface Props {
    name: string;
    extension: Extension;
    rightButtons?: React.ReactNode;
    leftButtons?: React.ReactNode;
    borderRadiusTop?: boolean;
}

const Icon = (props: { extension: Extension }) => {
    switch (props.extension) {
        case Extension.GQL:
        case Extension.GRAPHQL:
            return <span>{<img src={GraphQLIcon} alt="graphql-logo" className="inline w-5 h-5" />}</span>;
        case Extension.JSON:
            return <span className="text-yellow-500  w-5 h-5">{"{ }"}</span>;
    }
};

const Ending = (props: { extension: Extension }) => {
    let content = "";
    switch (props.extension) {
        case Extension.GQL:
            content = ".gql";
            break;
        case Extension.GRAPHQL:
            content = ".graphql";
            break;
        case Extension.JSON:
            content = ".json";
            break;
    }

    return <span>{content}</span>;
};

export const FileName = ({ extension, name, rightButtons, leftButtons, borderRadiusTop = true }: Props) => {
    const theme = useContext(ThemeContext);

    return (
        <div
            className={classNames(
                "w-full flex justify-between items-center h-12 m-0 py-3 px-4",
                theme.theme === Theme.LIGHT ? "bg-white" : "bg-draculaDark",
                borderRadiusTop && "rounded-t-xl"
            )}
        >
            {leftButtons ? (
                <div className="flex items-center">{leftButtons}</div>
            ) : (
                <div className={classNames("text-sm", theme.theme === Theme.LIGHT ? "text-black" : "text-white")}>
                    <Icon extension={extension}></Icon> <span className="pl-1">{name}</span>
                    <Ending extension={extension}></Ending>
                </div>
            )}
            {rightButtons ? <div className="flex items-center">{rightButtons}</div> : null}
        </div>
    );
};
