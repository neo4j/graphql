FROM node:lts@sha256:ffebb4405810c92d267a764b21975fb2d96772e41877248a37bf3abaa0d3b590

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]