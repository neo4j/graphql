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

import { useContext, useEffect } from "react";

import { Extension, FileName } from "../../components/Filename";
import { EDITOR_QUERY_INPUT } from "../../constants";
import { Theme, ThemeContext } from "../../contexts/theme";
import { handleEditorDisableState } from "./utils";

export interface Props {
    loading: boolean;
    buttons: any;
    elementRef: React.MutableRefObject<HTMLDivElement | null>;
}

export const GraphQLQueryEditor = ({ elementRef, loading, buttons }: Props) => {
    const theme = useContext(ThemeContext);

    useEffect(() => {
        handleEditorDisableState(elementRef.current, loading);
    }, [loading]);

    return (
        <div className="rounded-b-xl" style={{ width: "100%", height: "100%" }}>
            <FileName
                name={"query"}
                extension={Extension.GRAPHQL}
                rightButtons={buttons}
                borderRadiusTop={false}
            ></FileName>
            <div
                id={EDITOR_QUERY_INPUT}
                className={theme.theme === Theme.LIGHT ? "cm-light" : "cm-dark"}
                ref={elementRef}
            />
        </div>
    );
};
