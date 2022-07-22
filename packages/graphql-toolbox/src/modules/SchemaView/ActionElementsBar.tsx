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
import { Button, HeroIcon, IconButton } from "@neo4j-ndl/react";

interface Props {
    hasSchema: boolean;
    loading: boolean;
    isIntrospecting: boolean;
    formatTheCode: () => void;
    introspect: () => Promise<void>;
    onSubmit: () => void;
    saveAsFavorite: () => void;
}

export const ActionElementsBar = ({
    hasSchema,
    loading,
    isIntrospecting,
    formatTheCode,
    introspect,
    onSubmit,
    saveAsFavorite,
}: Props) => {
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
            <div className="flex-1 flex justify-end gap-2">
                <ProTooltip tooltipText="Save as Favorite" width={120} left={-42} top={45}>
                    <IconButton
                        data-test-schema-editor-favourite-button
                        aria-label="Save as favorite"
                        // Icon button background should be white, remove bg-white
                        // as soon as it's fixed
                        className="bg-white"
                        color="neutral"
                        onClick={saveAsFavorite}
                        disabled={loading}
                    >
                        <HeroIcon iconName="StarIcon" type="outline" />
                    </IconButton>
                </ProTooltip>
                <ProTooltip tooltipText="Prettify" width={60} left={-12} top={45}>
                    <IconButton
                        data-test-schema-editor-prettify-button
                        aria-label="Prettify code"
                        className="bg-white"
                        color="neutral"
                        onClick={formatTheCode}
                        disabled={loading}
                    >
                        <HeroIcon iconName="CodeIcon" type="outline" />
                    </IconButton>
                </ProTooltip>
                <ProTooltip tooltipText="This will overwrite your current typeDefs!" width={260} left={-40} top={45}>
                    <Button
                        data-test-schema-editor-introspect-button
                        color="neutral"
                        fill="outlined"
                        onClick={introspect}
                        disabled={loading}
                        loading={isIntrospecting}
                    >
                        Generate type definitions
                    </Button>
                </ProTooltip>
                <Button
                    data-test-schema-editor-build-button
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
