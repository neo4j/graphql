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

import { useContext, useEffect, useState } from "react";
import { GraphQLSchema } from "graphql";
import { TopBar } from "../TopBar/TopBar";
import { Login } from "../Login/Login";
import { SchemaView } from "../SchemaView/SchemaView";
import { Editor } from "../EditorView/Editor";
import { AuthContext } from "../../contexts/auth";
import { ScreenContext, Screen } from "../../contexts/screen";
import { invokeSegmentAnalytics } from "../../analytics/segment-snippet";

export const Main = () => {
    const auth = useContext(AuthContext);
    const screen = useContext(ScreenContext);
    const [schema, setSchema] = useState<GraphQLSchema | undefined>(undefined);

    useEffect(() => {
        const segmentKey =
            process.env.NODE_ENV === "production"
                ? process.env.SEGMENT_GRAPHQL_TOOLBOX_PROD_SOURCE
                : process.env.SEGMENT_GRAPHQL_TOOLBOX_DEV_SOURCE;
        console.log("NODE_ENV", process.env.NODE_ENV);
        console.log("p", !!process.env.SEGMENT_GRAPHQL_TOOLBOX_PROD_SOURCE);
        console.log("d", !!process.env.SEGMENT_GRAPHQL_TOOLBOX_DEV_SOURCE);
        console.log("t", process.env.TEST_T);
        if (!segmentKey) return;
        invokeSegmentAnalytics(segmentKey);
        console.log("Initialized app");
    }, []);

    if (!auth.driver) {
        return (
            <div className="flex">
                <div className="flex w-full h-full flex-col">
                    <Login />
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full h-full flex-col">
            <TopBar />
            <div className="h-content-container w-full overflow-y-auto bg-contentBlue">
                {screen.view === Screen.TYPEDEFS ? (
                    <SchemaView
                        hasSchema={!!schema}
                        onChange={(schema) => {
                            setSchema(schema);
                            screen.setScreen(Screen.EDITOR);
                        }}
                    />
                ) : (
                    <Editor schema={schema} />
                )}
            </div>
        </div>
    );
};
