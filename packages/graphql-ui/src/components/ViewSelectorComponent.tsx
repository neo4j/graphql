import { Fragment, useContext } from "react";
import { ViewSelector, ViewSelectorItem } from "@neo4j-ndl/react";
import { Screen, ScreenContext } from "../contexts/screen";

const ViewSelectorComponent = () => {
    const screen = useContext(ScreenContext);

    const handleOnScreenChange = (screen) => {
        screen.setScreen(screen);
    };

    return (
        <ViewSelector onChange={handleOnScreenChange} selected={screen.view.toString()}>
            <Fragment key="screen-selector">
                <ViewSelectorItem value={Screen.TYPEDEFS.toString()}>Definition</ViewSelectorItem>
                <ViewSelectorItem value={Screen.EDITOR.toString()}>Editor</ViewSelectorItem>
            </Fragment>
        </ViewSelector>
    );
};

export default ViewSelectorComponent;
