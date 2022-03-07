import { Col, ColsWrapper, Row, RowsWrapper } from "react-grid-resizable";

export interface Props {
    queryEditor: any | null;
    resultView: any;
    parameterEditor: any;
    explorer?: any;
    showExplorer: boolean;
    showDocs: boolean;
}

export const Frame = (props: Props) => {
    return (
        <div className="h-full flex flex-row">
            {props.showExplorer ? <div className="w-60 border-2">Explorer</div> : null}
            <Row className={"flex-1"} initialHeight={1200}>
                <ColsWrapper>
                    <Col initialWidth={800} left={false}>
                        <RowsWrapper>
                            <Row initialHeight={900}>{props.queryEditor}</Row>
                            <Row initialHeight={300}>{props.parameterEditor}</Row>
                        </RowsWrapper>
                    </Col>
                    <Col initialWidth={700}>
                        <RowsWrapper>
                            <Row initialHeight={2300}>
                                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                                    <div style={{ position: "absolute", width: "100%", height: "100%" }}>
                                        {props.resultView}
                                    </div>
                                    {props.showDocs ? (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                bottom: 0,
                                                right: 0,
                                                width: "250px",
                                                backgroundColor: "rgba(255,255,255,0.5)",
                                            }}
                                        >
                                            Docs
                                        </div>
                                    ) : null}
                                </div>
                            </Row>
                        </RowsWrapper>
                    </Col>
                </ColsWrapper>
            </Row>
        </div>
    );
};
