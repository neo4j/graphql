import { useContext } from "react";
import { ThemeContext, Theme } from "../contexts/theme";
// @ts-ignore - SVG Import
import GraphQLIcon from "../assets/graphql-icon.svg";

export enum Extension {
    JSON,
    GQL,
    GRAPHQL,
}

export interface Props {
    name: string;
    extension: Extension;
    buttons?: any;
}

const Icon = (props: { extension: Extension }) => {
    switch (props.extension) {
        case Extension.GQL:
        case Extension.GRAPHQL:
            return <span>{<img src={GraphQLIcon} alt="graphql-logo" className="inline w-5 h-5" />}</span>;
        case Extension.JSON:
            return <span className="text-yellow-500  w-5 h-5">{"{ }"}</span>;
    }
};

const Ending = (props: { extension: Extension }) => {
    let content = "";
    switch (props.extension) {
        case Extension.GQL:
            content = ".gql";
            break;
        case Extension.GRAPHQL:
            content = ".graphql";
            break;
        case Extension.JSON:
            content = ".json";
            break;
    }

    return <span>{content}</span>;
};

export const FileName = ({ extension, name, buttons }: Props) => {
    const theme = useContext(ThemeContext);

    return (
        <div
            className={`w-full h-12 m-0 pt-3 pb-3 pl-4 ${
                theme.theme === Theme.LIGHT ? "bg-white" : "bg-draculaDark"
            } rounded-tl-xl rounded-tr-xl flex justify-between items-center`}
        >
            <div className={`${theme.theme === Theme.LIGHT ? "text-black" : "text-white"} text-sm`}>
                <Icon extension={extension}></Icon> <span className="pl-1">{name}</span>
                <Ending extension={extension}></Ending>
            </div>
            {buttons ? <div className="flex items-center">{buttons}</div> : null}
        </div>
    );
};
