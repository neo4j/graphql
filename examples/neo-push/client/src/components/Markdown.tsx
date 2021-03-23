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

class Code extends React.PureComponent {
    constructor(props: any) {
        super(props);
        this.setRef = this.setRef.bind(this);
    }

    setRef(el: any) {
        // @ts-ignore
        this.codeEl = el;
    }

    componentDidMount() {
        this.highlightCode();
    }

    componentDidUpdate() {
        this.highlightCode();
    }

    highlightCode() {
        // @ts-ignore
        window.hljs.highlightBlock(this.codeEl);
    }

    render() {
        return (
            <pre>
                {/* @ts-ignore */}
                <code ref={this.setRef}>{this.props.value}</code>
            </pre>
        );
    }
}

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
    return <ReactMarkdown source={props.markdown} renderers={{ code: Code }} />;
}
