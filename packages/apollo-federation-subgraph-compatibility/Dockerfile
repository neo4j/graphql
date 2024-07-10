FROM node:lts@sha256:786005cf39792f7046bcd66491056c26d2dbcc669c072d1a1e4ef4fcdddd26eb

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]