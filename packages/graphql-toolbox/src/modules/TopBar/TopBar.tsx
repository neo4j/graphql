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

import { Button, HeroIcon, IconButton, Label } from "@neo4j-ndl/react";
import { Fragment, useContext, useEffect } from "react";
import { DEFAULT_BOLT_URL } from "../../constants";
// @ts-ignore - SVG Import
import Neo4jLogoIcon from "../../assets/neo4j-logo-color.svg";
import { CustomSelect } from "../../components/CustomSelect";
import { AuthContext } from "../../contexts/auth";
import { Screen, ScreenContext } from "../../contexts/screen";
import { SettingsContext } from "../../contexts/settings";
import { tracking } from "../../analytics/tracking";
import { cannySettings } from "../../common/canny";

export const TopBar = () => {
    const auth = useContext(AuthContext);
    const settings = useContext(SettingsContext);
    const screen = useContext(ScreenContext);
    const greenDot = <span className="ml-1 mr-1 h-2 w-2 bg-green-400 rounded-full inline-block" />;
    const redDot = <span className="ml-1 mr-1 h-2 w-2 bg-red-400 rounded-full inline-block" />;

    useEffect(() => {
        if (window.Canny && window.CannyIsLoaded) {
            window.Canny("initChangelog", cannySettings);
        }
        return () => {
            if (window.Canny && window.CannyIsLoaded) {
                window.Canny("closeChangelog");
            }
        };
    }, []);

    const handleHelpClick = () => {
        settings.setIsShowHelpDrawer(!settings.isShowHelpDrawer);
    };

    const handleSettingsClick = () => {
        settings.setIsShowSettingsDrawer(!settings.isShowSettingsDrawer);
    };

    const handleSetSelectedDatabaseName = (databaseName: string) => {
        auth.setSelectedDatabaseName(databaseName);
        tracking.trackChangeDatabase({ screen: "type definitions" });
    };

    const handleSendFeedbackClick = () => {
        window.open("https://feedback.neo4j.com/graphql", "SendFeedback");
        tracking.trackHelpLearnFeatureLinks({ screen: screen.view, actionLabel: "Send Feedback" });
    };

    const constructDbmsUrlWithUsername = (): string => {
        if (!auth || !auth.connectUrl || !auth.username) return DEFAULT_BOLT_URL;
        const { connectUrl, username } = auth;

        const modifiedUsername = username.length > 30 ? `${username.substring(0, 28)}...` : username;
        const [protocol, host] = connectUrl.split(/:\/\//);
        if (!protocol || !host) return DEFAULT_BOLT_URL;

        return `${protocol}://${modifiedUsername}@${host}`;
    };

    return (
        <div className="flex w-full h-16 bg-white border-b border-gray-100">
            <div className="flex-1 flex justify-start">
                <div className="flex items-center">
                    <img src={Neo4jLogoIcon} alt="Neo4j logo Icon" className="ml-8 w-24" />
                    <p className="ml-6 text-base whitespace-nowrap">GraphQL Toolbox</p>
                    <Label className="ml-3" color="info" fill="outlined">
                        Beta
                    </Label>
                </div>
            </div>
            <div className="flex-1 flex justify-center">
                <div className="flex items-center">
                    <p className="mr-2">{auth?.isConnected ? greenDot : redDot} </p>
                    <div className="flex items-center">{constructDbmsUrlWithUsername()}</div>
                    {auth.databases?.length ? (
                        <Fragment>
                            <span className="mx-2">/</span>
                            <CustomSelect
                                value={auth.selectedDatabaseName}
                                disabled={screen.view !== Screen.TYPEDEFS}
                                onChange={(event) => handleSetSelectedDatabaseName(event.target.value)}
                                testTag="data-test-topbar-database-selection"
                            >
                                {auth.databases.map((db) => {
                                    return (
                                        <option key={db.name} value={db.name}>
                                            {db.name}
                                        </option>
                                    );
                                })}
                            </CustomSelect>
                        </Fragment>
                    ) : null}
                </div>
            </div>
            <div className="flex-1 flex justify-end">
                <div className="flex items-center text-sm">
                    <Button
                        data-test-send-feedback-topbar
                        className="w-44 mr-4"
                        color="primary"
                        fill="outlined"
                        onClick={handleSendFeedbackClick}
                    >
                        <HeroIcon className="w-full h-full" iconName="SparklesIcon" type="outline" />
                        <span className="whitespace-nowrap">Send feedback</span>
                    </Button>
                    {!auth.isNeo4jDesktop ? (
                        <div className="mr-4 pr-4 border-r border-gray-700">
                            <Button
                                data-test-topbar-disconnect-button
                                className="w-36"
                                color="primary"
                                fill="text"
                                onClick={() => auth?.logout()}
                            >
                                <HeroIcon className="w-full h-full" iconName="LogoutIcon" type="outline" />
                                <span>Disconnect</span>
                            </Button>
                        </div>
                    ) : null}
                    <div className="flex items-center mr-6">
                        <div className="canny-indication-wrapper pb-8 pl-10 pointer-events-none absolute">
                            {/* This element is not clickable as we do not want to show the changelog here */}
                            <span data-canny-changelog></span>
                        </div>
                        <IconButton
                            data-test-topbar-help-button
                            aria-label="Help and learn drawer"
                            onClick={handleHelpClick}
                            buttonSize="large"
                            clean
                        >
                            <HeroIcon iconName="QuestionMarkCircleIcon" type="outline" />
                        </IconButton>
                        <IconButton
                            clean
                            data-test-topbar-settings-button
                            aria-label="Application settings"
                            onClick={handleSettingsClick}
                            buttonSize="large"
                        >
                            <HeroIcon iconName="CogIcon" type="outline" />
                        </IconButton>
                    </div>
                </div>
            </div>
        </div>
    );
};
