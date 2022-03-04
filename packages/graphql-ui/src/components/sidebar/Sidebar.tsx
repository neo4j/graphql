import { useContext } from "react";
import * as AuthContext from "../../contexts/auth";

export interface Props {
    onShowTypeDefs?: () => void;
    onShowEditor?: () => void;
}

const SideBar = (props: Props) => {
    const auth = useContext(AuthContext.Context);

    return (
        <div className="flex flex-col w-16 h-screen py-4 overflow-y-auto bg-sidebargrey">
            <div className="flex flex-col justify-between align-center text-white">
                <ul>
                    <li className="pb-8 flex justify-center">
                        <span className="font-medium text-2xl cursor-pointer">
                            <button
                                onClick={() => {
                                    if (props.onShowTypeDefs) props.onShowTypeDefs();
                                }}
                            >
                                S
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
                                Q
                            </button>
                        </span>
                    </li>
                </ul>
            </div>
            <div className="flex flex-col-reverse flex-1 justify-between align-center text-white">
                <ul>
                    <li className="pb-4 flex justify-center">
                        <span className="font-medium text-2xl cursor-pointer">
                            <button onClick={() => auth?.logout()}>L</button>
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default SideBar;
