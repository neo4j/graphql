import { Tab, Tabs } from "@neo4j-ndl/react";
import { PlusIconOutline, XMarkIconOutline } from "@neo4j-ndl/react/icons";
import { useStore } from "../../store";

export const EditorTabs = () => {
    const store = useStore();

    const closeTab = (idx: number) => {
        store.closeTab(idx);
    };

    const handleTabsChange = (idx: string) => {
        if (idx === "new") return;
        store.changeActiveTabIndex(Number.parseInt(idx));
    };

    // TODO:
    // add max amount of tabs. if max reached, remove "add" button
    // title ellipse
    // too many tabs -> scroll horizontal
    // icons need to change bg color when hovered

    return (
        <div className="mb-1">
            {useStore.getState().tabs.length ? (
                <Tabs
                    size="small"
                    fill="underline"
                    value={useStore.getState().activeTabIndex.toString()}
                    onChange={handleTabsChange}
                >
                    {useStore.getState().tabs.map((tab, idx) => {
                        return (
                            <Tab key={idx.toString()} tabId={idx.toString()}>
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
