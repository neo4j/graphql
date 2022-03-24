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

import { Fragment, useContext } from "react";
import { ViewSelector, ViewSelectorItem } from "@neo4j-ndl/react";
import { Screen, ScreenContext } from "../contexts/screen";

interface Props {
    isEditorEnabled?: boolean;
    elementKey: string;
}

export const ViewSelectorComponent = ({ isEditorEnabled = true, elementKey }: Props) => {
    const screen = useContext(ScreenContext);

    const handleOnScreenChange = (selectedScreen: string) => {
        const next = selectedScreen === Screen.TYPEDEFS.toString() ? Screen.TYPEDEFS : Screen.EDITOR;
        screen.setScreen(next);
    };

    return (
        <ViewSelector
            key={`${elementKey}-selector-main`}
            onChange={handleOnScreenChange}
            selected={screen.view.toString()}
        >
            <Fragment key={`${elementKey}-screen-fragment`}>
                <ViewSelectorItem value={Screen.TYPEDEFS.toString()}>Definition</ViewSelectorItem>
                <ViewSelectorItem value={Screen.EDITOR.toString()} disabled={isEditorEnabled}>
                    Editor
                </ViewSelectorItem>
            </Fragment>
        </ViewSelector>
    );
};
