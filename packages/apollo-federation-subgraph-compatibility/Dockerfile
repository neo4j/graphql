FROM node:lts@sha256:23c24e85395992be118734a39903e08c8f7d1abc73978c46b6bda90060091a49

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]