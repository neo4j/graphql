FROM node:lts@sha256:e74b31755a45dac7ff6c208d26589e1a4eb99bc7f6eec8a469f4aa1106297437

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]