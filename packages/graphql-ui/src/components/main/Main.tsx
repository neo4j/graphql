import { Content } from "../content/Content";
import SideBar from "../sidebar/Sidebar";
import TopBar from "../topbar/TopBar";
import * as AuthContext from "../../contexts/auth";
import { useContext, useState } from "react";
import Login from "../login/Login";
import { SchemaEditor } from "../schemaeditor/SchemaEditor";
import { GraphQLSchema } from "graphql";
import { Editor } from "../editor/Editor";

export enum Pages {
    TYPEDEFS,
    EDITOR,
}

const Main = () => {
    const auth = useContext(AuthContext.Context);
    const [schema, setSchema] = useState<GraphQLSchema | undefined>(undefined);
    const [activePage, setActivePage] = useState<Pages>(Pages.TYPEDEFS);

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
            <SideBar
                activePage={activePage}
                allowRedirectToEdit={!!schema}
                onShowTypeDefs={() => setActivePage(Pages.TYPEDEFS)}
                onShowEditor={() => setActivePage(Pages.EDITOR)}
                onLogout={() => {
                    setActivePage(Pages.TYPEDEFS);
                    setSchema(undefined);
                }}
            />
            <div className="flex w-full h-full flex-col">
                <TopBar />
                <Content>
                    {activePage === Pages.TYPEDEFS ? (
                        <SchemaEditor
                            onChange={(schema) => {
                                setSchema(schema);
                                setActivePage(Pages.EDITOR);
                            }}
                        ></SchemaEditor>
                    ) : (
                        <Editor schema={schema} />
                    )}
                </Content>
            </div>
        </div>
    );
};

export default Main;
