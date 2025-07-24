FROM node:lts@sha256:e515259afd26f60db74957c62203c93d45760f2ba864d94accfa2edfc1ac17cf

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]