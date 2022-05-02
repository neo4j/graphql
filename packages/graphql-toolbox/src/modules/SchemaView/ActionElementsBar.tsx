import { ProTooltip } from "../../components/ProTooltip";
import { ViewSelectorComponent } from "../../components/ViewSelectorComponent";
import { Button, HeroIcon } from "@neo4j-ndl/react";
import {
    SCHEMA_EDITOR_BUILD_BUTTON,
    SCHEMA_EDITOR_INTROSPECT_BUTTON,
    SCHEMA_EDITOR_PRETTY_BUTTON,
} from "src/constants";

interface Props {
    hasSchema: boolean;
    loading: boolean;
    formatTheCode: () => void;
    introspect: () => Promise<void>;
    onSubmit: () => void;
}

export const ActionElementsBar = ({ hasSchema, loading, formatTheCode, introspect, onSubmit }: Props) => {
    return (
        <div className="flex items-center w-full pb-4">
            <div className="justify-start">
                <ProTooltip
                    tooltipText="Build the schema to use the Editor"
                    arrowPositionLeft={true}
                    blockVisibility={hasSchema}
                    width={210}
                    left={200}
                    top={1}
                >
                    <ViewSelectorComponent
                        key="schema-editor-view-selector"
                        elementKey="schema-editor-view-selector"
                        isEditorDisabled={!hasSchema}
                    />
                </ProTooltip>
            </div>
            <div className="flex-1 flex justify-end">
                <ProTooltip tooltipText="Prettify" width={60} left={-2} top={45}>
                    <Button
                        id={SCHEMA_EDITOR_PRETTY_BUTTON}
                        className="mr-4"
                        color="neutral"
                        fill="outlined"
                        style={{ padding: "0.75rem" }}
                        onClick={formatTheCode}
                        disabled={loading}
                    >
                        <HeroIcon className="h-7 w-7" iconName="CodeIcon" type="outline" />
                    </Button>
                </ProTooltip>
                <Button
                    id={SCHEMA_EDITOR_INTROSPECT_BUTTON}
                    className="mr-4"
                    color="neutral"
                    fill="outlined"
                    onClick={introspect}
                    disabled={loading}
                >
                    Generate typeDefs
                </Button>
                <Button
                    id={SCHEMA_EDITOR_BUILD_BUTTON}
                    style={{ backgroundColor: "#006FD6" }}
                    fill="filled"
                    onClick={onSubmit}
                    disabled={loading}
                >
                    Build schema
                </Button>
            </div>
        </div>
    );
};
