FROM node:lts@sha256:e9df36b6e7e4c66e77ee132a63fd4d11740418fcad43e419b444e9165d34fd2b

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]