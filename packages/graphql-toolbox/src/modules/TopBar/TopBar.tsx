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
import Neo4jLogoIcon from "../../assets/Neo4j-logo-color.svg";
import { AuthContext } from "../../contexts/auth";
import { SettingsContext } from "../../contexts/settings";

export const TopBar = () => {
    const auth = useContext(AuthContext);
    const settings = useContext(SettingsContext);
    const greenDot = <span className="ml-1 mr-1 h-2 w-2 bg-green-400 rounded-full inline-block" />;
    const redDot = <span className="ml-1 mr-1 h-2 w-2 bg-red-400 rounded-full inline-block" />;

    const handleHelpClick = () => {
        settings.setIsShowHelpDrawer(!settings.isShowHelpDrawer);
    };

    const handleSettingsClick = () => {
        settings.setIsShowSettingsDrawer(!settings.isShowSettingsDrawer);
    };

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
                        {auth?.isConnected ? greenDot : redDot}{" "}
                        <span className="opacity-60">{auth?.isConnected ? "Online" : "Offline"}</span>
                    </p>
                </div>
            </div>
            <div className="flex-1 flex justify-end">
                <div className="flex items-center justify-space text-sm">
                    {!auth.isNeo4jDesktop ? (
                        <p className="flex items-center mr-6 pr-6 border-r border-gray-700">
                            <span
                                data-test-topbar-disconnect-button
                                className="cursor-pointer"
                                onClick={() => {
                                    auth?.logout();
                                }}
                            >
                                <HeroIcon className="h-7 w-7" iconName="LogoutIcon" type="outline" />
                            </span>
                            <span className="ml-4">Disconnect</span>
                        </p>
                    ) : null}
                    <div className="flex items-center">
                        <div className="cursor-pointer mr-4">
                            <HeroIcon
                                data-test-topbar-help-button
                                onClick={handleHelpClick}
                                className="h-7 w-7"
                                iconName="QuestionMarkCircleIcon"
                                type="outline"
                            />
                        </div>
                        <div
                            className="ml-2 mr-6 cursor-pointer"
                            data-test-topbar-settings-button
                            onClick={handleSettingsClick}
                        >
                            <HeroIcon className="h-7 w-7" iconName="CogIcon" type="outline" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
