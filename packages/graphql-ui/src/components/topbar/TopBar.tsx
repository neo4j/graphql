import { useContext } from "react";
import * as AuthContext from "../../contexts/auth";

const TopBar = () => {
    const auth = useContext(AuthContext.Context);
    const greenDot = <span className="ml-1 h-3 w-3 bg-green-400 rounded-full inline-block" />;
    const redDot = <span className="ml-1 h-3 w-3 bg-red-400 rounded-full inline-block" />;

    return (
        <div className="flex justify-center w-full h-16 p-4 bg-primarydark">
            <div className="flex items-center justify-space text-white text-xs">
                <div className="mr-3">Connected to: {auth?.connectUrl}</div>
                <div className="flex items-center">Status: {auth?.isConnected ? greenDot : redDot}</div>
            </div>
        </div>
    );
};

export default TopBar;
