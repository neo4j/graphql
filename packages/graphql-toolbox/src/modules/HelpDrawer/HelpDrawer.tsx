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

import { Dispatch, Fragment, SetStateAction, useContext, useState } from "react";
import { GraphQLSchema } from "graphql";
import { HeroIcon } from "@neo4j-ndl/react";
import { Screen, ScreenContext } from "../../contexts/screen";
import { Resources } from "./Resources";
import { Keybindings } from "./Keybindings";
import { DocExplorerComponent } from "./DocExplorerComponent";

enum EditorViewTiles {
    SCHEMA_DOCS,
    KEYBINDINGS,
}

interface Props {
    onClickClose: () => void;
    schema?: GraphQLSchema;
}

const CannyFeedbackButton = (): JSX.Element => {
    return (
        <a
            data-test-help-drawer-canny-button
            className="flex justify-start items-center"
            href="https://feedback.neo4j.com/graphql"
            target="_blank" rel="noreferrer"
        >
            <HeroIcon className="h-6 w-6 mr-2" type="outline" iconName="ChatIcon" />
            <p className="p-0 m-0">Send feedback</p>
        </a>
    );
};

const EditorScreenTiles = ({
    onClickShowDocs,
    onClickShowKeybindings,
}: {
    onClickShowDocs: () => void;
    onClickShowKeybindings: () => void;
}): JSX.Element => {
    return (
        <div className="pb-8 flex text-sm">
            <div
                data-test-help-drawer-schema-doc-tile
                className="n-bg-primary-50 p-4 pb-6 rounded-2xl cursor-pointer text-white w-1/2 mr-2 flex"
                onClick={onClickShowDocs}
            >
                <HeroIcon className="h-6 w-6 mr-2 flex-1" type="outline" iconName="ColorSwatchIcon" />
                <span className="flex-1">Current schema documentation</span>
            </div>

            <div
                data-test-help-drawer-keybindings-tile-editor-view
                className="n-bg-neutral-20 p-4 pb-6 rounded-2xl cursor-pointer w-1/2 flex"
                onClick={onClickShowKeybindings}
            >
                <HeroIcon className="h-6 w-6 mr-2" type="outline" iconName="DesktopComputerIcon" />
                <span>List of keybindings</span>
            </div>
        </div>
    );
};

const SchemaScreenDrawer = ({
    showSubComponent,
    onClickClose,
    setShowSubComponent,
}: {
    showSubComponent: boolean;
    onClickClose: () => void;
    setShowSubComponent: Dispatch<SetStateAction<boolean>>;
}) => {
    return (
        <Fragment>
            {showSubComponent ? (
                <Keybindings onClickClose={onClickClose} onClickBack={() => setShowSubComponent(false)} />
            ) : (
                <Fragment>
                    <div
                        data-test-help-drawer-keybindings-tile-schema-view
                        className="n-bg-neutral-20 p-4 pb-6 mb-8 rounded-2xl cursor-pointer flex text-sm"
                        onClick={() => setShowSubComponent(true)}
                    >
                        <HeroIcon className="h-6 w-6 mr-2" type="outline" iconName="DesktopComputerIcon" />
                        <span>List of keybindings</span>
                    </div>
                    <Resources showSchemaView={true} />
                </Fragment>
            )}
        </Fragment>
    );
};

const EditorScreenDrawer = ({
    showSubComponent,
    onClickClose,
    setShowSubComponent,
    schema,
}: {
    showSubComponent: boolean;
    onClickClose: () => void;
    setShowSubComponent: Dispatch<SetStateAction<boolean>>;
    schema?: GraphQLSchema;
}) => {
    const [selectedTile, setSelectedTile] = useState<string>("");

    const handleOnClickSchemaDocTile = () => {
        setSelectedTile(EditorViewTiles.SCHEMA_DOCS.toString());
        setShowSubComponent(true);
    };
    const handleOnClickKeybindingsTile = () => {
        setSelectedTile(EditorViewTiles.KEYBINDINGS.toString());
        setShowSubComponent(true);
    };

    return (
        <Fragment>
            {showSubComponent ? (
                <Fragment>
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
                </Fragment>
            ) : (
                <Fragment>
                    <EditorScreenTiles
                        onClickShowDocs={handleOnClickSchemaDocTile}
                        onClickShowKeybindings={handleOnClickKeybindingsTile}
                    />
                    <Resources showSchemaView={false} />
                </Fragment>
            )}
        </Fragment>
    );
};

export const HelpDrawer = ({ onClickClose, schema }: Props) => {
    const screen = useContext(ScreenContext);
    const [showSubComponent, setShowSubComponent] = useState<boolean>(false);

    return (
        <div className="p-6 w-full" data-test-help-drawer>
            {!showSubComponent ? (
                <div className="pb-6 flex justify-between items-center" data-test-help-drawer-title>
                    <Fragment>
                        <span className="h5">Help &#38; learn</span>
                        <span className="text-lg cursor-pointer" data-test-help-drawer-close onClick={onClickClose}>
                            {"\u2715"}
                        </span>
                    </Fragment>
                </div>
            ) : null}
            <Fragment>
                {screen.view === Screen.TYPEDEFS ? (
                    <SchemaScreenDrawer
                        showSubComponent={showSubComponent}
                        onClickClose={onClickClose}
                        setShowSubComponent={setShowSubComponent}
                    />
                ) : (
                    <EditorScreenDrawer
                        showSubComponent={showSubComponent}
                        onClickClose={onClickClose}
                        setShowSubComponent={setShowSubComponent}
                        schema={schema}
                    />
                )}
                {!showSubComponent ? (
                    <div className="absolute bottom-8 right-28 n-text-primary-40 font-bold text-sm">
                        <CannyFeedbackButton />
                    </div>
                ) : null}
            </Fragment>
        </div>
    );
};
