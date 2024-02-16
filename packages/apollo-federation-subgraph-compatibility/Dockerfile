FROM node:lts@sha256:bb868b0eef46a4432f28d853bd26e6e42f154e4b95ae594b579890c76282b726

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]