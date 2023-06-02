import { useContext } from "react";

import { Menu, MenuItem, MenuItems } from "@neo4j-ndl/react";
import { CheckIconOutline } from "@neo4j-ndl/react/icons";

import { tracking } from "../../analytics/tracking";
import { AuthContext } from "../../contexts/auth";
import { Screen, ScreenContext } from "../../contexts/screen";

interface Props {
    menuButtonRef: React.RefObject<HTMLDivElement>;
    dbmsUrlWithUsername: string;
    openConnectionMenu: boolean;
    setOpenConnectionMenu: (v: boolean) => void;
}

export const ConnectionMenu = ({
    menuButtonRef,
    dbmsUrlWithUsername,
    openConnectionMenu,
    setOpenConnectionMenu,
}: Props) => {
    const auth = useContext(AuthContext);
    const screen = useContext(ScreenContext);

    const handleSetSelectedDatabaseName = (databaseName: string) => {
        auth.setSelectedDatabaseName(databaseName);
        tracking.trackChangeDatabase({ screen: "type definitions" });
    };

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
                        description={<span className="n-text-neutral-50">{dbmsUrlWithUsername}</span>}
                        onClick={() => auth?.logout()}
                    />
                ) : null}
            </MenuItems>
        </Menu>
    );
};
