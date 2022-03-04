import { Content } from "../content/Content";
import SideBar from "../sidebar/Sidebar";
import TopBar from "../topbar/TopBar";
import * as AuthContext from "../../contexts/auth";
import { useContext, useState } from "react";
import Login from "../login/Login";
import { GetSchema } from "../get_schema/GetSchema";
import { GraphQLSchema } from "graphql";
import { Editor } from "../editor/Editor";

const Main = () => {
    const auth = useContext(AuthContext.Context);
    const [schema, setSchema] = useState<GraphQLSchema | undefined>(undefined);

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
            <SideBar onShowTypeDefs={() => setSchema(undefined)} />
            <div className="flex w-full h-full flex-col">
                <TopBar />
                <Content>
                    {!schema ? (
                        <GetSchema onChange={(schema) => setSchema(schema)}></GetSchema>
                    ) : (
                        <Editor schema={schema} />
                    )}
                </Content>
            </div>
        </div>
    );
};

export default Main;
