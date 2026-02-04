FROM node:lts@sha256:1de022d8459f896fff2e7b865823699dc7a8d5567507e8b87b14a7442e07f206

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]