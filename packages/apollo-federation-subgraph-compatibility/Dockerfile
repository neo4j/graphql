FROM node:lts@sha256:6326b52a508f0d99ffdbfaa29a69380321b215153db6f32974835bac71b38fa4

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]