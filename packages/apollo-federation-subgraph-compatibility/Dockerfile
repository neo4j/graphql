FROM node:lts@sha256:02cd2205818f121c13612721876f28c18bd50148bb8af532ea121c96ffcb59bf

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]