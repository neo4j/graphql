// @ts-ignore
import GraphQLIcon from "../../../public/graphql-icon.svg";

export enum Extension {
    JSON,
    GQL,
}

export interface Props {
    name: string;
    extension: Extension;
}

const Icon = (props: { extension: Extension }) => {
    switch (props.extension) {
        case Extension.GQL:
            return (
                <span>
                    <img src={GraphQLIcon} alt="graphql-logo" className="inline w-1/6 h-1/6" />
                </span>
            );
        case Extension.JSON:
            return <span className="text-yellow-500 text-xl">{"{ }"}</span>;
    }
};

const Ending = (props: { extension: Extension }) => {
    let content = "";
    switch (props.extension) {
        case Extension.GQL:
            content = ".gql";
        case Extension.JSON:
            content = ".json";
    }

    return <span>{content}</span>;
};

export const FileName = (props: Props) => {
    return (
        <div className="m-0 p-3 bg-draculaDark w-48">
            <p className="text-white">
                <Icon extension={props.extension}></Icon> <span>{props.name}</span>
                <Ending extension={props.extension}></Ending>
            </p>
        </div>
    );
};
