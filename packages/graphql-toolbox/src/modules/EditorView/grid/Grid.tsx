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

import { useDragResize } from "@graphiql/react";

// @ts-ignore - SVG Import
import unionHorizontal from "./union_horizontal.svg";
// @ts-ignore - SVG Import
import unionVertical from "./union_vertical.svg";

import "./grid.css";

interface Props {
    queryEditor: React.ReactNode | null;
    resultView: React.ReactNode;
    variablesEditor: React.ReactNode;
}

export const Grid = ({ queryEditor, resultView, variablesEditor }: Props) => {
    const editorResize = useDragResize({
        direction: "horizontal",
        sizeThresholdFirst: 270,
        sizeThresholdSecond: 100,
        storageKey: "editorFlex",
        defaultSizeRelation: 1,
    });

    const editorToolsResize = useDragResize({
        direction: "vertical",
        sizeThresholdSecond: 60,
        storageKey: "secondaryEditorFlex",
        defaultSizeRelation: 3,
    });

    return (
        <div className="flex w-full h-full">
            <div className="flex flex-1 grid-class">
                <div ref={editorResize.firstRef}>
                    <div className="flex flex-1 flex-col">
                        <div ref={editorToolsResize.firstRef}>
                            <div className="w-full h-full">{queryEditor}</div>
                        </div>
                        <div ref={editorToolsResize.dragBarRef}>
                            <div className="vertical-drag-bar" style={{ backgroundImage: `url(${unionHorizontal})` }} />
                        </div>
                        <div ref={editorToolsResize.secondRef}>
                            <div className="w-full h-full">{variablesEditor}</div>
                        </div>
                    </div>
                </div>
                <div ref={editorResize.dragBarRef}>
                    <div className="horizontal-drag-bar" style={{ backgroundImage: `url(${unionVertical})` }} />
                </div>
                <div ref={editorResize.secondRef}>
                    <div className="w-full h-full">{resultView}</div>
                </div>
            </div>
        </div>
    );
};
