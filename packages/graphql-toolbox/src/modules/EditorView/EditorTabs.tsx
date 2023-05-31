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

import { Tab, Tabs } from "@neo4j-ndl/react";
import { PlusIconOutline, XMarkIconOutline } from "@neo4j-ndl/react/icons";
import { useStore } from "../../store";

export const EditorTabs = () => {
    const store = useStore();

    const closeTab = (idx: number) => {
        store.closeTab(idx);
    };

    const handleTabsChange = (idx: string) => {
        if (idx === "new") return;
        store.changeActiveTabIndex(Number.parseInt(idx));
    };

    // TODO:
    // e2e test using tabs
    //

    return (
        <div className="mb-1">
            {useStore.getState().tabs.length ? (
                <div className="w-full overflow-auto whitespace-nowrap">
                    <Tabs
                        size="small"
                        fill="underline"
                        value={useStore.getState().activeTabIndex.toString()}
                        onChange={handleTabsChange}
                    >
                        {useStore.getState().tabs.map((tab, idx) => {
                            return (
                                <Tab data-test-query-editor-tab={tab.title} key={idx.toString()} tabId={idx.toString()}>
                                    <div className="flex justify-center items-center">
                                        <span
                                            className="overflow-ellipsis overflow-hidden"
                                            style={{ maxWidth: "7rem" }}
                                        >
                                            {tab.title}
                                        </span>
                                        <XMarkIconOutline
                                            data-test-close-icon-query-editor-tab
                                            className="h-5 w-5 ml-2 hover:bg-gray-200"
                                            aria-label="Close Icon"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                closeTab(idx);
                                            }}
                                        />
                                    </div>
                                </Tab>
                            );
                        })}
                        <Tab key={"new"} tabId={"new"} className="pos-absolute">
                            <PlusIconOutline
                                data-test-new-query-editor-tab
                                className="h-5 w-5 hover:bg-gray-200"
                                aria-label="Add tab Icon"
                                onClick={() => store.addTab()}
                            />
                        </Tab>
                    </Tabs>
                </div>
            ) : null}
        </div>
    );
};
