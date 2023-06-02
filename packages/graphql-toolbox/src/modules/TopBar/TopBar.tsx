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

import { useContext, useEffect, useRef, useState } from "react";

import { Button, IconButton, Menu, MenuItem, MenuItems } from "@neo4j-ndl/react";
import {
    CheckIconOutline,
    ChevronDownIconOutline,
    Cog8ToothIconOutline,
    QuestionMarkCircleIconOutline,
} from "@neo4j-ndl/react/icons";

import { tracking } from "../../analytics/tracking";
// @ts-ignore - SVG Import
import Neo4jLogoIcon from "../../assets/neo4j-logo-white.svg";
import { cannySettings } from "../../common/canny";
import { DEFAULT_BOLT_URL } from "../../constants";
import { AuthContext } from "../../contexts/auth";
import { Screen, ScreenContext } from "../../contexts/screen";
import { SettingsContext } from "../../contexts/settings";

export const TopBar = () => {
    const auth = useContext(AuthContext);
    const settings = useContext(SettingsContext);
    const screen = useContext(ScreenContext);
    const menuButtonRef = useRef<HTMLDivElement>(null);
    const [openConnectionMenu, setOpenConnectionMenu] = useState<boolean>(false);
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

    useEffect(() => {
        function handleClickOutsideComponent(event) {
            if (
                !menuButtonRef?.current?.contains(event.target) &&
                !document.getElementById("connection-menu")?.contains(event.target)
            ) {
                setOpenConnectionMenu(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutsideComponent);
        return () => {
            document.removeEventListener("mousedown", handleClickOutsideComponent);
        };
    }, [menuButtonRef]);

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

    const ConnectionMenu = () => {
        return (
            <Menu
                rev={undefined}
                id="connection-menu"
                open={openConnectionMenu}
                anchorEl={menuButtonRef.current}
                className="mt-2"
                onClick={() => setOpenConnectionMenu(false)}
            >
                <MenuItems rev={undefined}>
                    {auth.databases?.length ? (
                        <>
                            <Menu.Subheader title="Databases" data-test-topbar-database-selection />
                            {auth.databases.map((db) => {
                                return (
                                    <MenuItem
                                        rev={undefined}
                                        key={db.name}
                                        title={db.name.length > 50 ? `${db.name.substring(0, 48)}...` : db.name}
                                        disabled={screen.view !== Screen.TYPEDEFS}
                                        icon={db.name === auth.selectedDatabaseName ? <CheckIconOutline /> : <span />}
                                        onClick={() => handleSetSelectedDatabaseName(db.name)}
                                    />
                                );
                            })}
                        </>
                    ) : null}
                    <Menu.Divider />
                    {!auth.isNeo4jDesktop ? (
                        <MenuItem
                            rev={undefined}
                            className="n-text-danger-50"
                            title="Disconnect"
                            description={<span className="n-text-neutral-50">{constructDbmsUrlWithUsername()}</span>}
                            onClick={() => auth?.logout()}
                        />
                    ) : null}
                </MenuItems>
            </Menu>
        );
    };

    return (
        <div className="flex w-full h-16 n-bg-neutral-90 border-b border-gray-100">
            <div className="flex-1 flex justify-start">
                <div className="flex items-center">
                    <img src={Neo4jLogoIcon} alt="Neo4j logo Icon" className="ml-8 w-24" />
                    <p className="ml-6 n-text-neutral-50 text-base whitespace-nowrap">GraphQL Toolbox</p>
                </div>
            </div>
            <div className="flex-1 flex justify-center">
                <div
                    onClick={() => setOpenConnectionMenu(!openConnectionMenu)}
                    onKeyDown={() => setOpenConnectionMenu(!openConnectionMenu)}
                    ref={menuButtonRef}
                    className="flex items-center n-text-dark-neutral-text-weaker cursor-pointer"
                    role="button"
                    tabIndex={0}
                >
                    <p className="mr-2">{auth?.isConnected ? greenDot : redDot} </p>
                    <div className="flex items-center">{constructDbmsUrlWithUsername()}</div>
                    <span className="mx-2">/</span>
                    <span className="max-w-[11rem] overflow-ellipsis whitespace-nowrap overflow-hidden">
                        {auth.selectedDatabaseName}
                    </span>
                    <ChevronDownIconOutline className="ml-2 w-4 h-4" />
                </div>
                <ConnectionMenu />
            </div>
            <div className="flex-1 flex justify-end">
                <div className="flex items-center text-sm">
                    <Button
                        data-test-send-feedback-topbar
                        className="ndl-theme-dark mr-2"
                        color="primary"
                        fill="outlined"
                        onClick={handleSendFeedbackClick}
                    >
                        Send feedback
                    </Button>
                    <div className="flex items-center mr-6">
                        <div className="canny-indication-wrapper pb-8 pl-10 pointer-events-none absolute">
                            {/* This element is not clickable as we do not want to show the changelog here */}
                            <span data-canny-changelog></span>
                        </div>
                        <IconButton
                            data-test-topbar-help-button
                            className="ndl-theme-dark"
                            aria-label="Help and learn drawer"
                            onClick={handleHelpClick}
                            size="large"
                            clean
                        >
                            <QuestionMarkCircleIconOutline />
                        </IconButton>
                        <IconButton
                            clean
                            data-test-topbar-settings-button
                            className="ndl-theme-dark"
                            aria-label="Application settings"
                            onClick={handleSettingsClick}
                            size="large"
                        >
                            <Cog8ToothIconOutline />
                        </IconButton>
                    </div>
                </div>
            </div>
        </div>
    );
};

// TODO: remove that 30 seconds check if there have been new databases? Instead check it on load of the connection menu?
