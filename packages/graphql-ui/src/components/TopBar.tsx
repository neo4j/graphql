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
import { HeroIcon } from "@neo4j-ndl/react";
// @ts-ignore - SVG Import
import Neo4jLogoIcon from "../assets/neo4j-logo-color.svg";
import { AuthContext } from "../contexts/auth";

export const TopBar = () => {
    const auth = useContext(AuthContext);
    const greenDot = <span className="ml-1 mr-2 h-2 w-2 bg-green-400 rounded-full inline-block" />;
    const redDot = <span className="ml-1 mr-2 h-2 w-2 bg-red-400 rounded-full inline-block" />;

    return (
        <div className="flex w-full h-16 bg-white border-b border-gray-100">
            <div className="flex-1 flex justify-start">
                <div className="flex items-center justify-space text-sm">
                    <img src={Neo4jLogoIcon} alt="Neo4j logo Icon" className="ml-8 w-24" />
                    <p className="ml-8 text-base">GraphQL Toolbox</p>
                </div>
            </div>
            <div className="flex-1 flex justify-center">
                <div className="flex items-center justify-space text-sm">
                    <p>{auth?.connectUrl}</p>
                    <p className="ml-1">
                        {auth?.isConnected ? greenDot : redDot} {auth?.isConnected ? "Online" : "Offline"}
                    </p>
                </div>
            </div>
            <div className="flex-1 flex justify-end">
                <div className="flex items-center justify-space text-sm">
                    <p className="flex items-center">
                        <span
                            className="cursor-pointer"
                            onClick={() => {
                                auth?.logout();
                            }}
                        >
                            <HeroIcon className="h-7 w-7" iconName="LogoutIcon" type="outline" />
                        </span>
                        <span className="ml-4">Log out</span>
                    </p>
                    <span className="ml-6 mr-6">|</span>
                    <p className="flex items-center">
                        <span className="cursor-pointer" onClick={() => {}}>
                            <HeroIcon className="h-7 w-7" iconName="QuestionMarkCircleIcon" type="outline" />
                        </span>
                        <span className="ml-4 mr-4 cursor-pointer" onClick={() => {}}>
                            <HeroIcon className="h-7 w-7" iconName="CogIcon" type="outline" />
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};
