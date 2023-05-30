import { Tab, Tabs } from "@neo4j-ndl/react";
import { PlusIconOutline, XMarkIconOutline } from "@neo4j-ndl/react/icons";
import { useStore } from "../../store";

export const EditorTabs = () => {
    const store = useStore();

    const closeTab = (idx: number) => {
        store.closeTab(idx);
    };

    const handleTabsChange = (idx: number | string) => {
        if (typeof idx === "string") return;
        store.changeActiveTabIndex(idx);
    };

    // TODO:
    // add max amount of tabs
    // title ellipse
    // too many tabs -> scroll horizontal
    // icons need to change bg color when hovered

    return (
        <div className="mb-1">
            {store.tabs ? (
                <Tabs size="small" fill="underline" value={store.activeTabIndex} onChange={handleTabsChange}>
                    {store.tabs.map((tab, idx) => {
                        return (
                            <Tab key={idx} tabId={idx}>
                                <div className="flex justify-center items-center">
                                    {tab.title}{" "}
                                    <XMarkIconOutline
                                        className="h-5 w-5"
                                        aria-label="Close Icon"
                                        onClick={() => closeTab(idx)}
                                    />
                                </div>
                            </Tab>
                        );
                    })}
                    <Tab key={"new"} tabId={"new"}>
                        <PlusIconOutline className="h-5 w-5" aria-label="Add tab Icon" onClick={() => store.addTab()} />
                    </Tab>
                </Tabs>
            ) : null}
        </div>
    );
};
