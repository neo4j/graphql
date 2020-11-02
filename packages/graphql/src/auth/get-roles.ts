function getRoles(jwt: any): string[] {
    const roles = jwt.Roles || jwt.roles || jwt.Role || jwt.role || [];

    return roles;
}

export default getRoles;
