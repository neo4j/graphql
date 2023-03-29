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
import { ComputerDesktopIconOutline } from "@neo4j-ndl/react/icons";
import { Resources } from "./Resources";
import { Keybindings } from "./Keybindings";

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
                    <div
                        data-test-help-drawer-keybindings-tile-schema-view
                        className="n-bg-neutral-20 p-4 pb-6 mb-8 rounded-2xl cursor-pointer flex text-sm"
                        onClick={() => setShowSubComponent(true)}
                        onKeyDown={() => setShowSubComponent(true)}
                        role="button"
                        tabIndex={0}
                    >
                        <ComputerDesktopIconOutline className="h-6 w-6 mr-2" />
                        <span>List of keybindings</span>
                    </div>
                    <Resources showSchemaView={true} />
                </>
            )}
        </>
    );
};
