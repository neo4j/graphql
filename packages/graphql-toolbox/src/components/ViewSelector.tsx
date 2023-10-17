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

import { Tabs, Tip } from "@neo4j-ndl/react";

import { Screen, ScreenContext } from "../contexts/screen";

interface Props {
    hasSchema: boolean;
}

export const ViewSelector = ({ hasSchema }: Props) => {
    const screen = useContext(ScreenContext);

    const handleOnScreenChange = (selectedScreen: string) => {
        const next = selectedScreen === Screen.TYPEDEFS.toString() ? Screen.TYPEDEFS : Screen.EDITOR;
        screen.setScreen(next);
    };

    return (
        <>
            <Tabs className="h-12 pl-4" fill="underline" onChange={handleOnScreenChange} value={screen.view.toString()}>
                <Tabs.Tab data-test-view-selector-type-defs tabId={Screen.TYPEDEFS.toString()}>
                    Type definitions
                </Tabs.Tab>
                <Tabs.Tab data-test-view-selector-editor tabId={Screen.EDITOR.toString()} disabled={!hasSchema}>
                    <Tip allowedPlacements={["right"]}>
                        <Tip.Trigger>Query editor</Tip.Trigger>
                        {!hasSchema && <Tip.Content>Build the schema to use the Query editor</Tip.Content>}
                    </Tip>
                </Tabs.Tab>
            </Tabs>
        </>
    );
};
