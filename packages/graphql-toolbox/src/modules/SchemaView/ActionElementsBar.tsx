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

interface Props {
    hasSchema: boolean;
    loading: boolean;
    formatTheCode: () => void;
    introspect: () => Promise<void>;
    onSubmit: () => void;
    saveAsFavorite: () => void;
}

export const ActionElementsBar = ({
    hasSchema,
    loading,
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
            <div className="flex-1 flex justify-end">
                <ProTooltip tooltipText="Save as Favorite" width={120} left={-35} top={45}>
                    <Button
                        data-test-schema-editor-favourite-button
                        className="mr-4"
                        color="neutral"
                        fill="outlined"
                        style={{ padding: "0.75rem" }}
                        onClick={saveAsFavorite}
                        disabled={loading}
                    >
                        <HeroIcon className="h-6 w-6" iconName="StarIcon" type="outline" />
                    </Button>
                </ProTooltip>
                <ProTooltip tooltipText="Prettify" width={60} left={-2} top={45}>
                    <Button
                        data-test-schema-editor-prettify-button
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
                <ProTooltip tooltipText="This will overwrite your current typeDefs!" width={260} left={-40} top={45}>
                    <Button
                        data-test-schema-editor-introspect-button
                        className="mr-4"
                        color="neutral"
                        fill="outlined"
                        onClick={introspect}
                        disabled={loading}
                    >
                        Generate typeDefs
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
