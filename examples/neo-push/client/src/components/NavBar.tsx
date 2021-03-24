import React, { useContext } from "react";
import { Navbar, Nav, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import constants from "../constants";
import { auth } from "../contexts";

const navStyles = {
    signOutIcon: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "25px",
        minWidth: "25px",
        maxHeight: "25px",
        maxWidth: "25px",
        color: "red",
    },
};

function LoggedIn() {
    return (
        <>
            <Nav className="mr-auto navbar-item">
                <Link to={constants.DASHBOARD_PAGE}>Dashboard</Link>
            </Nav>
            <Nav className="d-flex flex-row">
                <Link to={constants.LOG_OUT_PAGE}>
                    <Card className="p-1 m-1">
                        <Nav.Item as="span">
                            <span style={navStyles.signOutIcon}>
                                <FontAwesomeIcon icon="sign-out-alt" size="1x" />
                            </span>
                        </Nav.Item>
                    </Card>
                </Link>
            </Nav>
        </>
    );
}

function LoggedOut() {
    return (
        <Nav className="ml-auto d-flex flex-row">
            <Link to={constants.SIGN_IN_PAGE}>
                <Card className="p-1 m-1">
                    <Nav.Item as="span">
                        <span className="navbar-login-icon">
                            <FontAwesomeIcon icon="sign-in-alt" size="1x" />
                        </span>
                    </Nav.Item>
                </Card>
            </Link>
            <Link to={constants.SIGN_UP_PAGE}>
                <Card className="p-1 m-1">
                    <Nav.Item as="span">
                        <span className="navbar-signup-icon">
                            <FontAwesomeIcon icon="user-plus" size="1x" />
                        </span>
                    </Nav.Item>
                </Card>
            </Link>
        </Nav>
    );
}

function NavBar() {
    const { isLoggedIn } = useContext(auth.Context);

    return (
        <Navbar bg="light" expand="lg" collapseOnSelect>
            <Navbar.Brand>
                <Link to="/" className="title-link">
                    Home
                </Link>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse id="responsive-navbar-nav">{isLoggedIn ? <LoggedIn /> : <LoggedOut />}</Navbar.Collapse>
        </Navbar>
    );
}

export default NavBar;
