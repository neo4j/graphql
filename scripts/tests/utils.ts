export const noGraphQLErrors = (result: any) => {
    if (result.errors) {
        console.log(result.errors);
    }

    // @ts-ignore
    expect(result.errors).toBeFalsy();
};
