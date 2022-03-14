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

import { useContext } from "react";
import { HeroIcon } from "@neo4j-ndl/react/lib/icons";
import * as AuthContext from "../contexts/auth";
import * as SideBarContext from "../contexts/sidebar";
// @ts-ignore
import Icon from "../assets/neo4j-white.svg";

export interface Props {
    allowRedirectToEdit: boolean;
    onLogout?: () => void;
}

export const SideBar = (props: Props) => {
    const auth = useContext(AuthContext.Context);
    const sidebar = useContext(SideBarContext.Context);

    return (
        <div className="flex flex-col w-16 h-screen n-bg-neutral-90">
            <div className="flex flex-col justify-between align-center text-white">
                <ul>
                    <li
                        className={`py-4 flex justify-center ${
                            sidebar.view === SideBarContext.Views.TYPEDEFS && "n-bg-neutral-80"
                        }`}
                    >
                        <span
                            className="font-medium text-2xl cursor-pointer"
                            onClick={() => {
                                sidebar.setView(SideBarContext.Views.TYPEDEFS);
                            }}
                        >
                            <HeroIcon className="h-8 w-8" iconName="DocumentTextIcon" type="outline" />
                        </span>
                    </li>
                    <li
                        className={`py-4 flex justify-center ${
                            sidebar.view === SideBarContext.Views.EDITOR && "n-bg-neutral-80"
                        }`}
                    >
                        <span
                            className={`font-medium text-2xl ${
                                props.allowRedirectToEdit ? "cursor-pointer" : "default"
                            }`}
                            onClick={() => {
                                if (!props.allowRedirectToEdit) return;
                                sidebar.setView(SideBarContext.Views.EDITOR);
                            }}
                        >
                            <HeroIcon className="h-8 w-8" iconName="SearchIcon" type="outline" />
                        </span>
                    </li>
                </ul>
            </div>
            <div className="flex flex-col-reverse flex-1 justify-between align-center text-white">
                <ul>
                    <li className="py-4 flex justify-center">
                        <span
                            className="font-medium text-2xl cursor-pointer"
                            onClick={() => {
                                if (props.onLogout) props.onLogout();
                                auth?.logout();
                            }}
                        >
                            <HeroIcon className="h-8 w-8" iconName="LogoutIcon" type="outline" />
                        </span>
                    </li>
                    <li className="py-4 flex justify-center">
                        <img src={Icon} alt="d.s" className="h-8 w-8" />
                    </li>
                </ul>
            </div>
        </div>
    );
};
