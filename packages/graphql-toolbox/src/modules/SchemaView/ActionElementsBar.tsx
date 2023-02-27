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

import { Button } from "@neo4j-ndl/react";
import { PlayIconOutline } from "@neo4j-ndl/react/icons";
import { tokens } from "@neo4j-ndl/base";
import { ProTooltip } from "../../components/ProTooltip";
import { ViewSelectorComponent } from "../../components/ViewSelectorComponent";

interface Props {
    hasSchema: boolean;
    loading: boolean;
    onSubmit: () => void;
}

export const ActionElementsBar = ({ hasSchema, loading, onSubmit }: Props) => {
    return (
        <div className="flex items-center h-12 w-full px-6">
            <div className="justify-start">
                <ProTooltip
                    tooltipText="Build the schema to use the editor"
                    arrowPositionOverride="left"
                    blockVisibility={hasSchema}
                    width={210}
                    left={253}
                    top={-3}
                >
                    <ViewSelectorComponent
                        key="schema-editor-view-selector"
                        elementKey="schema-editor-view-selector"
                        isEditorDisabled={!hasSchema}
                    />
                </ProTooltip>
            </div>
            <div className="flex-1 flex justify-end">
                <Button
                    data-test-schema-editor-build-button
                    style={{ backgroundColor: tokens.colors.primary[50] }}
                    fill="filled"
                    onClick={onSubmit}
                    disabled={loading}
                >
                    <PlayIconOutline className="h-5 w-5 pr-1" />
                    Build schema
                </Button>
            </div>
        </div>
    );
};
