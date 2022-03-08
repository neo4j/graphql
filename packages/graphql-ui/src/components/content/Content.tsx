import { PropsWithChildren } from "react";

export const Content = (props: PropsWithChildren<any>) => {
    return <div className="h-content-container w-full p-4 overflow-y-auto n-bg-neutral-20">{props.children}</div>;
};
