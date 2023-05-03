/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Checkbox, Radio, SmartTooltip } from "@neo4j-ndl/react";
import { QuestionMarkCircleIconOutline } from "@neo4j-ndl/react/icons";
import type React from "react";
import { useRef } from "react";
import { tracking } from "../../analytics/tracking";
import { useStore } from "../../store";
import { ConstraintState } from "../../types";

export const SchemaSettings = () => {
    const enableRegex = useStore((store) => store.enableRegex);
    const enableDebug = useStore((store) => store.enableDebug);
    const constraint = useStore((store) => store.constraint);

    const onChangeRegexCheckbox = (): void => {
        useStore.setState({ enableRegex: !enableRegex });
        tracking.trackSchemaSettingsCheckbox({
            screen: "type definitions",
            action: !enableRegex ? "true" : "false",
            box: "regex",
        });
    };

    const onChangeDebugCheckbox = (): void => {
        useStore.setState({ enableDebug: !enableDebug });
        tracking.trackSchemaSettingsCheckbox({
            screen: "type definitions",
            action: !enableDebug ? "true" : "false",
            box: "debug",
        });
    };

    const onChangeConstraintState = (nextConstraintState: string): void => {
        useStore.setState({ constraint: nextConstraintState });
        tracking.trackSchemaConstraints({ screen: "type definitions", value: ConstraintState[nextConstraintState] });
    };

    const InfoToolTip = ({ text, width }: { text: React.ReactNode; width: number }): JSX.Element => {
        const tooltipRef = useRef<SVGSVGElement | null>(null);
        return (
            <>
                <QuestionMarkCircleIconOutline className="ml-1 h-4 w-4" ref={tooltipRef} />
                <SmartTooltip allowedPlacements={["right"]} style={{ width: `${width || 200}px` }} ref={tooltipRef}>
                    {text}
                </SmartTooltip>
            </>
        );
    };

    return (
        <>
            <span className="h5">Schema options</span>
            <div className="mb-1 mt-3 flex items-baseline">
                <Checkbox
                    className="my-2"
                    aria-label="Enable Regex"
                    label="Enable Regex"
                    checked={enableRegex}
                    onChange={onChangeRegexCheckbox}
                />
                <InfoToolTip
                    text={
                        <span>
                            More information:{" "}
                            <a
                                className="underline"
                                href="https://neo4j.com/docs/graphql-manual/current/filtering/#filtering-regex"
                                target="_blank"
                                rel="noreferrer"
                            >
                                here
                            </a>
                        </span>
                    }
                    width={160}
                />
            </div>
            <div className="mb-1 mt-2 flex items-baseline">
                <Checkbox
                    data-test-schema-debug-checkbox
                    className="my-2"
                    aria-label="Enable Debug"
                    label="Enable Debug"
                    checked={enableDebug}
                    onChange={onChangeDebugCheckbox}
                />
                <InfoToolTip
                    text={
                        <span>
                            Also enable &quot;verbose&quot; logging in browser. Instructions:{" "}
                            <a
                                className="underline"
                                href="https://github.com/debug-js/debug#browser-support"
                                target="_blank"
                                rel="noreferrer"
                            >
                                here
                            </a>
                        </span>
                    }
                    width={370}
                />
            </div>
            <div className="mt-3 flex flex-col">
                <div className="flex items-center">
                    <span className="h5">Constraints</span>{" "}
                    <InfoToolTip
                        text={
                            <span>
                                More information:{" "}
                                <a
                                    className="underline"
                                    href="https://neo4j.com/docs/graphql-manual/current/type-definitions/indexes-and-constraints/#type-definitions-indexes-and-constraints-asserting"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    here
                                </a>
                            </span>
                        }
                        width={160}
                    />
                </div>
                <div className="mt-2">
                    <Radio
                        label="Check"
                        className="my-3"
                        checked={constraint === ConstraintState.check.toString()}
                        onChange={() => onChangeConstraintState(ConstraintState.check.toString())}
                    />
                    <Radio
                        label="Create"
                        className="my-3"
                        checked={constraint === ConstraintState.create.toString()}
                        onChange={() => onChangeConstraintState(ConstraintState.create.toString())}
                    />
                    <Radio
                        label="Ignore"
                        className="my-3"
                        checked={constraint === ConstraintState.ignore.toString()}
                        onChange={() => onChangeConstraintState(ConstraintState.ignore.toString())}
                    />
                </div>
            </div>
        </>
    );
};
