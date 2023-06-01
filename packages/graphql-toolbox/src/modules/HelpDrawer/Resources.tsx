import { useContext, useEffect } from "react";

import {
    AcademicCapIconOutline,
    ArrowSmallUpIconOutline,
    AtSymbolIconOutline,
    ChatBubbleOvalLeftEllipsisIconOutline,
    DocumentTextIconOutline,
    FunnelIconOutline,
    SpeakerWaveIconOutline,
    VariableIconOutline,
} from "@neo4j-ndl/react/icons";
import type { ReactNode } from "react";

import { tracking } from "../../analytics/tracking";
import { cannySettings } from "../../common/canny";
import type { Screen } from "../../contexts/screen";
import { ScreenContext } from "../../contexts/screen";

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
    icon: ReactNode;
    label: string;
    options?: {
        isCannyChangelog?: boolean;
    };
}

const linksResources: Links[] = [
    {
        href: "https://neo4j.com/docs/graphql-manual/current/",
        icon: <DocumentTextIconOutline className="h-6 w-6 mr-2 stroke-1" />,
        label: "Documentation",
    },
    {
        href: "empty",
        icon: <SpeakerWaveIconOutline className="h-6 w-6 mr-2 stroke-1" />,
        label: "What's new",
        options: {
            isCannyChangelog: true,
        },
    },
    {
        href: "https://neo4j.com/graphacademy/training-graphql-apis/enrollment/",
        icon: <AcademicCapIconOutline className="h-6 w-6 mr-2 stroke-1" />,
        label: "Neo4j Graph Academy",
    },
    {
        href: "https://discord.com/channels/787399249741479977/818578492723036210",
        icon: <ChatBubbleOvalLeftEllipsisIconOutline className="h-6 w-6 mr-2 stroke-1" />,
        label: "Community",
    },
];

const linksGithub: Links[] = [
    {
        href: "https://github.com/neo4j/graphql",
        icon: <DocumentTextIconOutline className="h-6 w-6 mr-2 stroke-1" />,
        label: "Github repository",
    },
    {
        href: "https://github.com/neo4j/graphql/issues",
        icon: <SpeakerWaveIconOutline className="h-6 w-6 mr-2 stroke-1" />,
        label: "Issue tracker",
    },
];

const linksDocumentation: Links[] = [
    {
        href: "https://neo4j.com/docs/graphql-manual/current/type-definitions/",
        icon: <DocumentTextIconOutline className="h-6 w-6 mr-2 stroke-1" />,
        label: "Type definitions",
    },
    {
        href: "https://neo4j.com/docs/graphql-manual/current/queries/",
        icon: <VariableIconOutline className="h-6 w-6 mr-2 stroke-1" />,
        label: "Example queries",
    },
    {
        href: "https://neo4j.com/docs/graphql-manual/current/directives/",
        icon: <AtSymbolIconOutline className="h-6 w-6 mr-2 stroke-1" />,
        label: "Directives",
    },
    {
        href: "https://neo4j.com/docs/graphql-manual/current/filtering/",
        icon: <FunnelIconOutline className="h-6 w-6 mr-2 stroke-1" />,
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
        <>
            <div className="flex items-center">
                <span className="h6">{listBlockTitle}</span>
                <ArrowSmallUpIconOutline className="h-4 w-4 ml-1 rotate-45" />
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
                                    {link.icon}
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
                                    {link.icon}
                                    <p className="p-0 m-0">{link.label}</p>
                                </a>
                            )}
                        </li>
                    );
                })}
            </ul>
        </>
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
                <>
                    <ResourceLinksBlock
                        listBlockTitle="Documentation"
                        links={linksDocumentation}
                        screen={screen.view}
                    />
                    <hr className="mb-6" />
                </>
            ) : null}
            <ResourceLinksBlock listBlockTitle="Github" links={linksGithub} screen={screen.view} />
            <hr className="mb-6" />
            <ResourceLinksBlock listBlockTitle="Resources" links={linksForResources} screen={screen.view} />
        </div>
    );
};
