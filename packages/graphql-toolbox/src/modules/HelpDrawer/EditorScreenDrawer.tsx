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

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import type { GraphQLSchema } from "graphql";
import { ComputerDesktopIconOutline, SwatchIconOutline } from "@neo4j-ndl/react/icons";
import { Resources } from "./Resources";
import { Keybindings } from "./Keybindings";
import { DocExplorerComponent } from "./DocExplorerComponent";
import type { Screen } from "../../contexts/screen";
import { tracking } from "../../analytics/tracking";

enum EditorViewTiles {
    SCHEMA_DOCS,
    KEYBINDINGS,
}

const EditorScreenTiles = ({
    onClickShowDocs,
    onClickShowKeybindings,
}: {
    onClickShowDocs: () => void;
    onClickShowKeybindings: () => void;
}): JSX.Element => {
    return (
        <div className="pb-8 flex text-sm">
            <button
                data-test-help-drawer-schema-doc-tile
                className="n-bg-primary-50 p-4 pb-6 rounded-2xl cursor-pointer text-white w-1/2 mr-2 flex"
                onClick={onClickShowDocs}
            >
                <SwatchIconOutline className="h-6 w-6 mr-2 flex-1" />
                <span className="flex-1">Current schema documentation</span>
            </button>

            <button
                data-test-help-drawer-keybindings-tile-editor-view
                className="n-bg-neutral-20 p-4 pb-6 rounded-2xl cursor-pointer w-1/2 flex"
                onClick={onClickShowKeybindings}
            >
                <ComputerDesktopIconOutline className="h-6 w-6 mr-2" />
                <span>List of keybindings</span>
            </button>
        </div>
    );
};

export const EditorScreenDrawer = ({
    showSubComponent,
    onClickClose,
    setShowSubComponent,
    schema,
    screen,
}: {
    showSubComponent: boolean;
    onClickClose: () => void;
    setShowSubComponent: Dispatch<SetStateAction<boolean>>;
    schema?: GraphQLSchema;
    screen: Screen;
}) => {
    const [selectedTile, setSelectedTile] = useState<string>("");

    const handleOnClickSchemaDocTile = () => {
        setSelectedTile(EditorViewTiles.SCHEMA_DOCS.toString());
        setShowSubComponent(true);
        tracking.trackOpenSchemaDocs({ screen, action: true, origin: "help drawer" });
    };
    const handleOnClickKeybindingsTile = () => {
        setSelectedTile(EditorViewTiles.KEYBINDINGS.toString());
        setShowSubComponent(true);
    };

    return (
        <>
            {showSubComponent ? (
                <>
                    {selectedTile === EditorViewTiles.SCHEMA_DOCS.toString() ? (
                        <DocExplorerComponent
                            schema={schema}
                            onClickClose={onClickClose}
                            onClickBack={() => setShowSubComponent(false)}
                        />
                    ) : null}
                    {selectedTile === EditorViewTiles.KEYBINDINGS.toString() ? (
                        <Keybindings onClickClose={onClickClose} onClickBack={() => setShowSubComponent(false)} />
                    ) : null}
                </>
            ) : (
                <>
                    <EditorScreenTiles
                        onClickShowDocs={handleOnClickSchemaDocTile}
                        onClickShowKeybindings={handleOnClickKeybindingsTile}
                    />
                    <Resources showSchemaView={false} />
                </>
            )}
        </>
    );
};
