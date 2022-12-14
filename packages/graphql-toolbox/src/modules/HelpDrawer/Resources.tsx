import { Fragment, useContext, useEffect } from "react";
import { HeroIcon } from "@neo4j-ndl/react";
import { tracking } from "../../analytics/tracking";
import { Screen, ScreenContext } from "../../contexts/screen";
import { cannySettings } from "../../common/canny";

interface Props {
    showSchemaView: boolean;
}

interface ResourceLinksBlockProps {
    listBlockTitle: string;
    links: Links[];
    screen: Screen;
}

interface Links {
    href: string;
    iconName: string;
    label: string;
    options?: {
        isCannyChangelog?: boolean;
    };
}

const linksResources: Links[] = [
    {
        href: "https://neo4j.com/docs/graphql-manual/current/",
        iconName: "DocumentTextIcon",
        label: "Documentation",
    },
    {
        href: "empty",
        iconName: "SpeakerphoneIcon",
        label: "What's new",
        options: {
            isCannyChangelog: true,
        },
    },
    {
        href: "https://neo4j.com/graphacademy/training-graphql-apis/enrollment/",
        iconName: "AcademicCapIcon",
        label: "Neo4j Graph Academy",
    },
    {
        href: "https://discord.com/channels/787399249741479977/818578492723036210",
        iconName: "ChatAlt2Icon",
        label: "Community",
    },
];

const linksGithub: Links[] = [
    {
        href: "https://github.com/neo4j/graphql",
        iconName: "DocumentTextIcon",
        label: "Github repository",
    },
    {
        href: "https://github.com/neo4j/graphql/issues",
        iconName: "SpeakerphoneIcon",
        label: "Issue tracker",
    },
];

const linksDocumentation: Links[] = [
    {
        href: "https://neo4j.com/docs/graphql-manual/current/type-definitions/",
        iconName: "DocumentTextIcon",
        label: "Type definitions",
    },
    {
        href: "https://neo4j.com/docs/graphql-manual/current/queries/",
        iconName: "VariableIcon",
        label: "Example queries",
    },
    {
        href: "https://neo4j.com/docs/graphql-manual/current/directives/",
        iconName: "AtSymbolIcon",
        label: "Directives",
    },
    {
        href: "https://neo4j.com/docs/graphql-manual/current/filtering/",
        iconName: "FilterIcon",
        label: "Filtering",
    },
];

const ResourceLinksBlock = ({ listBlockTitle, links, screen }: ResourceLinksBlockProps): JSX.Element => {
    const handleTrackCannyChangelogLink = () => {
        tracking.trackCannyChangelogLink({ screen });
    };

    const handleTrackHelpLearnFeatureLinks = (label: string) => {
        tracking.trackHelpLearnFeatureLinks({
            screen,
            actionLabel: label,
        });
    };

    return (
        <Fragment>
            <div className="flex items-center">
                <span className="h6">{listBlockTitle}</span>
                <HeroIcon className="h-4 w-4 ml-1 rotate-45" type="outline" iconName="ArrowSmUpIcon" />
            </div>
            <ul className="mb-6">
                {links.map((link) => {
                    return (
                        <li key={link.href} className="mt-6 cursor-pointer">
                            {link.options?.isCannyChangelog ? (
                                <div
                                    data-canny-changelog
                                    className="flex justify-start items-center"
                                    onClick={handleTrackCannyChangelogLink}
                                    onKeyDown={handleTrackCannyChangelogLink}
                                    role="link"
                                    tabIndex={0}
                                >
                                    <HeroIcon
                                        className="h-6 w-6 mr-2 stroke-1"
                                        type="outline"
                                        iconName={link.iconName as any}
                                    />
                                    <p className="p-0 m-0">{link.label}</p>
                                </div>
                            ) : (
                                <a
                                    className="flex justify-start items-center"
                                    href={link.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => handleTrackHelpLearnFeatureLinks(link.label)}
                                >
                                    <HeroIcon
                                        className="h-6 w-6 mr-2 stroke-1"
                                        type="outline"
                                        iconName={link.iconName as any}
                                    />
                                    <p className="p-0 m-0">{link.label}</p>
                                </a>
                            )}
                        </li>
                    );
                })}
            </ul>
        </Fragment>
    );
};

export const Resources = ({ showSchemaView }: Props): JSX.Element => {
    const screen = useContext(ScreenContext);
    const linksForResources = showSchemaView ? linksResources.slice(1) : linksResources;

    useEffect(() => {
        if (window.Canny && window.CannyIsLoaded) {
            window.Canny("initChangelog", cannySettings);
        }
        return () => {
            if (window.Canny && window.CannyIsLoaded) {
                window.Canny("closeChangelog");
            }
        };
    }, []);

    return (
        <div data-test-help-drawer-resources-list>
            {showSchemaView ? (
                <Fragment>
                    <ResourceLinksBlock
                        listBlockTitle="Documentation"
                        links={linksDocumentation}
                        screen={screen.view}
                    />
                    <hr className="mb-6" />
                </Fragment>
            ) : null}
            <ResourceLinksBlock listBlockTitle="Github" links={linksGithub} screen={screen.view} />
            <hr className="mb-6" />
            <ResourceLinksBlock listBlockTitle="Resources" links={linksForResources} screen={screen.view} />
        </div>
    );
};
