export const noGraphQLErrors = (result: any) => {
    // @ts-ignore
    expect(result.errors).toBeFalsy();
};
