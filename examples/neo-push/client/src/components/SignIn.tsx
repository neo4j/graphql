import React, { useState, useContext, useCallback, useEffect } from "react";
import { Form, Button, Card, Row, Alert, Spinner, Container } from "react-bootstrap";
import { auth, graphql } from "../contexts";
import { useHistory } from "react-router-dom";
import constants from "../constants";
import * as config from "../config";
import { SIGNIN } from "../queries";

function SignIn() {
    const history = useHistory();
    const { isLoggedIn, getSetValue } = useContext(auth.Context);
    const { mutate } = useContext(graphql.Context);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setError(null);
    }, [email, password, setError]);

    const submit = useCallback(
        async (event) => {
            event.preventDefault();

            setLoading(true);

            try {
                const response = await mutate({
                    mutation: SIGNIN,
                    variables: { email, password },
                });

                getSetValue()((v: any) => ({ ...v, isLoggedIn: true }));
                localStorage.setItem(config.JWT_KEY as string, response.signIn);
                history.push(constants.DASHBOARD_PAGE);
            } catch (e) {
                setError(e.message);
            }

            setLoading(false);
        },
        [email, password, error]
    );

    if (isLoggedIn) {
        history.push(constants.DASHBOARD_PAGE);
    }

    return (
        <Container>
            <Row className="center">
                <Form onSubmit={submit} className="mt-3 pb-3">
                    <Card className="pt-2 pb-3 pl-4 pr-4">
                        <h1 className="m-0">Sign In</h1>
                        <hr />
                        <Form.Group controlId="email">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control
                                autoFocus
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group controlId="password">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                autoFocus
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </Form.Group>
                        <Button className="mt-3" variant="primary" type="submit">
                            Sign In
                        </Button>
                        {loading && (
                            <div className="d-flex flex-column align-items-center">
                                <Spinner className="mt-5" animation="border" />
                            </div>
                        )}
                        {error && (
                            <Alert show className="mt-3" variant="danger">
                                {error}
                            </Alert>
                        )}
                        <hr />
                        <p>
                            Go to{" "}
                            <Alert.Link onClick={() => history.push(constants.SIGN_UP_PAGE)}>
                                Sign Up
                            </Alert.Link> instead
                        </p>
                    </Card>
                </Form>
            </Row>
        </Container>
    );
}

export default SignIn;
