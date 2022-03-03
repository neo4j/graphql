import Content from "../content/Content";
import SideBar from "../sidebar/Sidebar";
import TopBar from "../topbar/TopBar";
import * as AuthContext from "../../contexts/auth";
import { useContext } from "react";
import Login from "../login/Login";

const Main = () => {
    const auth = useContext(AuthContext.Context);

    if (!auth.driver) {
        return (
            <div className="flex">
                <div className="flex w-full h-full flex-col">
                    <Login />
                </div>
            </div>
        );
    }

    return (
        <div className="flex">
            <SideBar />
            <div className="flex w-full h-full flex-col">
                <TopBar />
                <Content />
            </div>
        </div>
    );
};

export default Main;
