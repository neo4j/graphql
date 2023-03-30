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

import { useContext, useState } from "react";
import type { GraphQLSchema } from "graphql";
import { ChatBubbleOvalLeftEllipsisIconOutline } from "@neo4j-ndl/react/icons";
import { EditorScreenDrawer } from "./EditorScreenDrawer";
import { SchemaScreenDrawer } from "./SchemaScreenDrawer";
import { Screen, ScreenContext } from "../../contexts/screen";
import { tracking } from "../../analytics/tracking";

interface Props {
    onClickClose: () => void;
    schema?: GraphQLSchema;
}

export const HelpDrawer = ({ onClickClose, schema }: Props) => {
    const screen = useContext(ScreenContext);
    const [showSubComponent, setShowSubComponent] = useState<boolean>(false);

    const CannyFeedbackButton = ({ screen }: { screen: Screen }): JSX.Element => {
        return (
            <a
                data-test-help-drawer-canny-button
                className="flex justify-start items-center"
                href="https://feedback.neo4j.com/graphql"
                target="_blank"
                rel="noreferrer"
                onClick={() => tracking.trackHelpLearnFeatureLinks({ screen, actionLabel: "Send Feedback" })}
            >
                <ChatBubbleOvalLeftEllipsisIconOutline className="h-6 w-6 mr-2" />
                <p className="p-0 m-0">Send feedback</p>
            </a>
        );
    };

    return (
        <div className="p-6 w-full" data-test-help-drawer>
            {!showSubComponent ? (
                <div className="pb-6 flex justify-between items-center" data-test-help-drawer-title>
                    <span className="h5">Help &#38; learn</span>
                    <span
                        className="text-lg cursor-pointer"
                        data-test-help-drawer-close
                        onClick={onClickClose}
                        onKeyDown={onClickClose}
                        role="button"
                        tabIndex={0}
                    >
                        {"\u2715"}
                    </span>
                </div>
            ) : null}
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
                    screen={screen.view}
                />
            )}
            {!showSubComponent ? (
                <div className="absolute bottom-8 right-28 n-text-primary-40 font-bold text-sm">
                    <CannyFeedbackButton screen={screen.view} />
                </div>
            ) : null}
        </div>
    );
};
