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

import { ComputerDesktopIconOutline } from "@neo4j-ndl/react/icons";
import type { Dispatch, SetStateAction } from "react";

import { Keybindings } from "./Keybindings";
import { Resources } from "./Resources";

export const SchemaScreenDrawer = ({
    showSubComponent,
    onClickClose,
    setShowSubComponent,
}: {
    showSubComponent: boolean;
    onClickClose: () => void;
    setShowSubComponent: Dispatch<SetStateAction<boolean>>;
}) => {
    return (
        <>
            {showSubComponent ? (
                <Keybindings onClickClose={onClickClose} onClickBack={() => setShowSubComponent(false)} />
            ) : (
                <>
                    <button
                        data-test-help-drawer-keybindings-tile-schema-view
                        className="w-full bg-neutral-20 hover:bg-neutral-25 p-4 mb-8 rounded-2xl cursor-pointer flex text-sm"
                        onClick={() => setShowSubComponent(true)}
                    >
                        <ComputerDesktopIconOutline className="h-6 w-6 mr-2" />
                        <span>List of keybindings</span>
                    </button>
                    <Resources showSchemaView={true} />
                </>
            )}
        </>
    );
};
