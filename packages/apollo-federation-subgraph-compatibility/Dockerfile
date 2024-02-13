FROM node:lts@sha256:489f37b8c21a3210adf4b2b42fbabd14bd8d30853a0a42194fecfaca2e3b0e78

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]