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

import { ProTooltip } from "../../components/ProTooltip";
import { ViewSelectorComponent } from "../../components/ViewSelectorComponent";
import { Button, HeroIcon } from "@neo4j-ndl/react";
import {
    SCHEMA_EDITOR_BUILD_BUTTON,
    SCHEMA_EDITOR_INTROSPECT_BUTTON,
    SCHEMA_EDITOR_PRETTY_BUTTON,
} from "src/constants";

interface Props {
    hasSchema: boolean;
    loading: boolean;
    formatTheCode: () => void;
    introspect: () => Promise<void>;
    onSubmit: () => void;
}

export const ActionElementsBar = ({ hasSchema, loading, formatTheCode, introspect, onSubmit }: Props) => {
    return (
        <div className="flex items-center w-full pb-4">
            <div className="justify-start">
                <ProTooltip
                    tooltipText="Build the schema to use the Editor"
                    arrowPositionLeft={true}
                    blockVisibility={hasSchema}
                    width={210}
                    left={200}
                    top={1}
                >
                    <ViewSelectorComponent
                        key="schema-editor-view-selector"
                        elementKey="schema-editor-view-selector"
                        isEditorDisabled={!hasSchema}
                    />
                </ProTooltip>
            </div>
            <div className="flex-1 flex justify-end">
                <ProTooltip tooltipText="Prettify" width={60} left={-2} top={45}>
                    <Button
                        id={SCHEMA_EDITOR_PRETTY_BUTTON}
                        className="mr-4"
                        color="neutral"
                        fill="outlined"
                        style={{ padding: "0.75rem" }}
                        onClick={formatTheCode}
                        disabled={loading}
                    >
                        <HeroIcon className="h-7 w-7" iconName="CodeIcon" type="outline" />
                    </Button>
                </ProTooltip>
                <Button
                    id={SCHEMA_EDITOR_INTROSPECT_BUTTON}
                    className="mr-4"
                    color="neutral"
                    fill="outlined"
                    onClick={introspect}
                    disabled={loading}
                >
                    Generate typeDefs
                </Button>
                <Button
                    id={SCHEMA_EDITOR_BUILD_BUTTON}
                    style={{ backgroundColor: "#006FD6" }}
                    fill="filled"
                    onClick={onSubmit}
                    disabled={loading}
                >
                    Build schema
                </Button>
            </div>
        </div>
    );
};
