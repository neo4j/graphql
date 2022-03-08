import { useContext } from "react";
import { HeroIcon } from "@neo4j-ndl/react/lib/icons";
import * as AuthContext from "../../contexts/auth";
import { Pages } from "../main/Main";

export interface Props {
    activePage?: Pages;
    allowRedirectToEdit: boolean;
    onShowTypeDefs?: () => void;
    onShowEditor?: () => void;
    onLogout?: () => void;
}

const SideBar = (props: Props) => {
    const auth = useContext(AuthContext.Context);

    return (
        <div className="flex flex-col w-16 h-screen overflow-y-auto n-bg-neutral-90">
            <div className="flex flex-col justify-between align-center text-white">
                <ul>
                    <li
                        className={`py-4 flex justify-center ${
                            props.activePage === Pages.TYPEDEFS && "n-bg-neutral-80"
                        }`}
                    >
                        <span
                            className="font-medium text-2xl cursor-pointer"
                            onClick={() => {
                                if (props.onShowTypeDefs) props.onShowTypeDefs();
                            }}
                        >
                            <HeroIcon className="h-8 w-8" iconName="DocumentTextIcon" type="outline" />
                        </span>
                    </li>
                    <li
                        className={`py-4 flex justify-center ${props.activePage === Pages.EDITOR && "n-bg-neutral-80"}`}
                    >
                        <span
                            className={`font-medium text-2xl ${
                                props.allowRedirectToEdit ? "cursor-pointer" : "default"
                            }`}
                            onClick={() => {
                                if (!props.allowRedirectToEdit) return;
                                if (props.onShowEditor) props.onShowEditor();
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
                </ul>
            </div>
        </div>
    );
};

export default SideBar;
