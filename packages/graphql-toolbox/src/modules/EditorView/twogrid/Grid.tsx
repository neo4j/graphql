import { useDragResize } from "@graphiql/react";
import type { GraphQLSchema } from "graphql";
import "./Grid.css";

export interface Props {
    schema?: GraphQLSchema;
}

export const Grid = ({ schema }: Props) => {
    // INFO: we cannot use the the provders/context as it requires a HTTP(S) endpoint to execute the queries against
    //
    // const editorContext = useEditorContext({ nonNull: true });
    // const executionContext = useExecutionContext({ nonNull: true });
    // const schemaContext = useSchemaContext({ nonNull: true });
    // const storageContext = useStorageContext();
    // const pluginContext = usePluginContext();
    //

    const editorResize = useDragResize({
        direction: "horizontal",
        storageKey: "editorFlex",
    });
    const editorToolsResize = useDragResize({
        defaultSizeRelation: 3,
        direction: "vertical",
        initiallyHidden: (() => {
            //   if (
            //     props.defaultEditorToolsVisibility === "variables" ||
            //     props.defaultEditorToolsVisibility === "headers"
            //   ) {
            //     return;
            //   }

            //   if (typeof props.defaultEditorToolsVisibility === "boolean") {
            //     return props.defaultEditorToolsVisibility ? undefined : "second";
            //   }

            //   return editorContext.initialVariables || editorContext.initialHeaders
            //     ? undefined
            //     : "second";
            return undefined;
        })(),
        sizeThresholdSecond: 60,
        storageKey: "secondaryEditorFlex",
    });

    return (
        <div className="flex w-full h-full graphiql-container">
            {/* TODO: insert query tabs here */}
            {/* The editors grid */}
            <div role="tabpanel" id="graphiql-session" className="graphiql-session">
                <div ref={editorResize.firstRef}>
                    <div className="graphiql-editors">
                        <div ref={editorToolsResize.firstRef}>
                            <div className="w-full h-full bg-green-300">placeholder</div>
                        </div>
                        <div ref={editorToolsResize.dragBarRef}>
                            <div className="graphiql-vertical-drag-bar" />
                        </div>
                        <div ref={editorToolsResize.secondRef}>
                            <div className="w-full h-full bg-yellow-300">placeholder</div>
                        </div>
                    </div>
                </div>
                <div ref={editorResize.dragBarRef}>
                    <div className="graphiql-horizontal-drag-bar" />
                </div>
                <div ref={editorResize.secondRef}>
                    <div className="w-full h-full bg-blue-300">placeholder</div>
                </div>
            </div>
        </div>
    );
};
