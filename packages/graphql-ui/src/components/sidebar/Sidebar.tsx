import { useContext } from "react";
import * as AuthContext from "../../contexts/auth";
import { HeroIcon } from "@neo4j-ndl/react/lib/icons";

export interface Props {
    onShowTypeDefs?: () => void;
    onShowEditor?: () => void;
}

const SideBar = (props: Props) => {
    const auth = useContext(AuthContext.Context);

    return (
        <div className="flex flex-col w-16 h-screen pt-6 pb-4 overflow-y-auto bg-sidebargrey">
            <div className="flex flex-col justify-between align-center text-white">
                <ul>
                    <li className="pb-8 flex justify-center">
                        <span className="font-medium text-2xl cursor-pointer">
                            <button
                                onClick={() => {
                                    if (props.onShowTypeDefs) props.onShowTypeDefs();
                                }}
                            >
                                <HeroIcon className="h-8 w-8" iconName="DocumentTextIcon" type="outline" />
                            </button>
                        </span>
                    </li>
                    <li className="pb-8 flex justify-center">
                        <span className="font-medium text-2xl cursor-pointer">
                            <button
                                onClick={() => {
                                    if (props.onShowEditor) props.onShowEditor();
                                }}
                            >
                                <HeroIcon className="h-8 w-8" iconName="SearchIcon" type="outline" />
                            </button>
                        </span>
                    </li>
                </ul>
            </div>
            <div className="flex flex-col-reverse flex-1 justify-between align-center text-white">
                <ul>
                    <li className="pb-4 flex justify-center">
                        <span className="font-medium text-2xl cursor-pointer">
                            <button onClick={() => auth?.logout()}>
                                <HeroIcon className="h-8 w-8" iconName="LogoutIcon" type="outline" />
                            </button>
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default SideBar;
