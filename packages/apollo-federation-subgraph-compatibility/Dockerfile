FROM node:lts@sha256:0e910f435308c36ea60b4cfd7b80208044d77a074d16b768a81901ce938a62dc

WORKDIR /app

COPY ["dist/bundle.js", "./"]

EXPOSE 4001

CMD [ "node", "bundle.js" ]