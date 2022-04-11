import React from "react";
import ReactMarkdown from "react-markdown";
import ReactMde from "react-mde";
import * as Showdown from "showdown";
import "react-mde/lib/styles/css/react-mde-all.css";

const converter = new Showdown.Converter({
    tables: true,
    simplifiedAutoLink: true,
    strikethrough: true,
    tasklists: true,
});

export function Editor(props: { markdown: string; onChange: (markdown: string) => void }) {
    const [selectedTab, setSelectedTab] = React.useState<"write" | "preview">("write");

    return (
        <ReactMde
            value={props.markdown}
            onChange={props.onChange}
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
            generateMarkdownPreview={(markdown) => Promise.resolve(converter.makeHtml(markdown))}
        />
    );
}

export function Render(props: { markdown: string }) {
    return <ReactMarkdown children={props.markdown} />;
}
