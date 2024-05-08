FROM node:lts@sha256:b6e7fef05c7609784c320e5c746aaf8d49221ec0eb3c1242fb673099511b0583

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]