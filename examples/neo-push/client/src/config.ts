// https://github.com/mrsteele/dotenv-webpack/issues/70
export const { API_URL } = process.env;
export const { JWT_KEY } = process.env;
export const DEV_SERVER_PORT = Number(process.env.DEV_SERVER_PORT);
