FROM node:10-alpine

COPY --from=brulescorp/br:scratch . /

RUN apk update && apk add \
  git \
  build-base \
  python \
  bash

COPY ./app/package.json /app
RUN npm i --prefix /app

VOLUME wbterm.out

COPY . /

WORKDIR /app
EXPOSE 9229

CMD ["node","run"]
