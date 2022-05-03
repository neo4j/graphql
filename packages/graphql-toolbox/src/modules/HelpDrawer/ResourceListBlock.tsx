import { Fragment } from "react";
import { HeroIcon } from "@neo4j-ndl/react";

interface Props {
    listBlockTitle: string;
    links: Links[];
}

export interface Links {
    href: string;
    iconName: string;
    label: string;
}

export const ResourceListBlock = ({ listBlockTitle, links }: Props): JSX.Element => {
    return (
        <Fragment>
            <div className="flex items-center">
                <span className="h6">{listBlockTitle}</span>
                <HeroIcon className="h-4 w-4 ml-1 rotate-45" type="outline" iconName="ArrowSmUpIcon" />
            </div>
            <ul className="pt-4 pb-6">
                {links.map((link) => {
                    return (
                        <li key={link.href} className="pb-6 cursor-pointer">
                            <a className="flex justify-start items-center" href={link.href} target="_blank">
                                {/* @ts-ignore - iconName is a string */}
                                <HeroIcon className="h-6 w-6 mr-2 stroke-1" type="outline" iconName={link.iconName} />
                                <p className="p-0 m-0">{link.label}</p>
                            </a>
                        </li>
                    );
                })}
            </ul>
        </Fragment>
    );
};
