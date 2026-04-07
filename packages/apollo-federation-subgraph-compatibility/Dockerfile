FROM node:lts@sha256:df0c595f03d86c4ee091334106c80620b415e8fc5d65b320f7cea1d5ce2f690c

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]