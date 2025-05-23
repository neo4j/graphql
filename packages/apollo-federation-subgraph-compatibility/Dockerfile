FROM node:lts@sha256:bc77e2513f2034916f1f84299e88d17ff3612f45ad17655df07008ec6778a4bf

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]