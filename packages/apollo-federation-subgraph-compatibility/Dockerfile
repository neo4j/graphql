FROM node:lts@sha256:fffa89e023a3351904c04284029105d9e2ac7020886d683775a298569591e5bb

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]