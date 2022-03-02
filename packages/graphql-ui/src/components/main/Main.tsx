import Content from "../content/Content";
import SideBar from "../sidebar/Sidebar";
import TopBar from "../topbar/TopBar";

const Main = () => {
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
