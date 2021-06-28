import React, { useState, useContext, useCallback, useEffect } from "react";
import { Form, Button, Card, Row, Alert, Spinner, Container } from "react-bootstrap";
import { auth, graphql } from "../contexts";
import { useHistory } from "react-router-dom";
import * as config from "../config";
import constants from "../constants";
import { SIGNUP } from "../queries";

function SignUp() {
    const history = useHistory();
    const { isLoggedIn, getSetValue } = useContext(auth.Context);
    const { mutate } = useContext(graphql.Context);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (password && passwordConfirm && password !== passwordConfirm) {
            setError("Passwords do not match");
        } else {
            setError("");
        }
    }, [email, password, passwordConfirm, setError]);

    const submit = useCallback(
        async (event) => {
            event.preventDefault();

            setLoading(true);

            try {
                const response = await mutate({
                    mutation: SIGNUP,
                    variables: { email, password },
                });

                getSetValue()((v: any) => ({ ...v, isLoggedIn: true }));
                localStorage.setItem(config.JWT_KEY as string, response.signUp);
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
                        <h1 className="m-0">SignUp</h1>
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
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group controlId="password-confirm">
                            <Form.Label>Password Confirm</Form.Label>
                            <Form.Control
                                type="password"
                                required
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                            />
                        </Form.Group>
                        <Button className="mt-3" variant="primary" type="submit">
                            Sign Up
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
                            <Alert.Link onClick={() => history.push(constants.SIGN_IN_PAGE)}>
                                Sign In
                            </Alert.Link> instead
                        </p>
                    </Card>
                </Form>
            </Row>
        </Container>
    );
}

export default SignUp;
