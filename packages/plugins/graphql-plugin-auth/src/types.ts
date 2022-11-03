type RequestLike = {
    headers?: { [key: string]: string };
    cookies?: { token?: string };
};

export { RequestLike }