FROM node:24.22.1@sha256:d862bb5d082c5ae0210ac07e8c0344cb8cf7bef6d78e9b8c50c179da923108ea

WORKDIR /app

COPY ["dist/bundle.js", "./"]

USER node

EXPOSE 4001

CMD [ "node", "bundle.js" ]