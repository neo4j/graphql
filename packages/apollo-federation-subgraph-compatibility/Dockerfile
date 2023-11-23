FROM node:lts@sha256:445acd9b2ef7e9de665424053bf95652e0b8995ef36500557d48faf29300170a

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]