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

import { useContext, useEffect } from "react";

import { Menu } from "@neo4j-ndl/react";
import { CheckIconOutline } from "@neo4j-ndl/react/icons";

import { AuthContext } from "../../contexts/auth";
import { Screen, ScreenContext } from "../../contexts/screen";

interface Props {
    menuButtonRef: React.RefObject<HTMLDivElement>;
    dbmsUrlWithUsername: string;
    openConnectionMenu: boolean;
    setOpenConnectionMenu: (v: boolean) => void;
    onNextSelectedDatabaseName: (databaseName: string) => void;
}

const CONNECTION_MENU_ID = "connection-menu";

export const ConnectionMenu = ({
    menuButtonRef,
    dbmsUrlWithUsername,
    openConnectionMenu,
    setOpenConnectionMenu,
    onNextSelectedDatabaseName,
}: Props) => {
    const auth = useContext(AuthContext);
    const screen = useContext(ScreenContext);

    useEffect(() => {
        function handleClickOutsideComponent(event) {
            if (
                !menuButtonRef?.current?.contains(event.target) &&
                !document.getElementById(CONNECTION_MENU_ID)?.contains(event.target)
            ) {
                setOpenConnectionMenu(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutsideComponent);
        return () => {
            document.removeEventListener("mousedown", handleClickOutsideComponent);
        };
    }, [menuButtonRef]);

    return (
        <Menu
            id={CONNECTION_MENU_ID}
            open={openConnectionMenu}
            anchorEl={menuButtonRef.current}
            className="mt-2 ndl-theme-light"
            onClick={() => setOpenConnectionMenu(false)}
        >
            <Menu.Items>
                {auth.databases?.length ? (
                    <>
                        <Menu.Subheader title="Databases" />
                        {auth.databases.map((db) => {
                            return (
                                <Menu.Item
                                    key={db.name}
                                    data-test-topbar-database={db.name}
                                    title={db.name.length > 50 ? `${db.name.substring(0, 48)}...` : db.name}
                                    disabled={screen.view !== Screen.TYPEDEFS}
                                    icon={db.name === auth.selectedDatabaseName ? <CheckIconOutline /> : <span />}
                                    onClick={() => onNextSelectedDatabaseName(db.name)}
                                />
                            );
                        })}
                    </>
                ) : null}
                {!auth.isNeo4jDesktop ? (
                    <>
                        <Menu.Divider />
                        <Menu.Item
                            data-test-topbar-disconnect
                            className="text-hibiscus-45"
                            title="Disconnect"
                            description={<span className="text-neutral-80">{dbmsUrlWithUsername}</span>}
                            onClick={() => auth?.logout()}
                        />
                    </>
                ) : null}
            </Menu.Items>
        </Menu>
    );
};
