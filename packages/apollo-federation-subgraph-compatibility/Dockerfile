FROM node:lts@sha256:7ba59ab8fe65c91b7d1945e456457c242d2cadaae912ba43ac8e179af6d43183

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]