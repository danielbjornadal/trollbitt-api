FROM node:16 as builder

COPY package.json tsconfig.json /
RUN npm install
COPY . .
RUN node_modules/typescript/bin/tsc

FROM node:16-alpine as app

RUN mkdir /app
WORKDIR /app

COPY --from=builder dist .
COPY --from=builder node_modules node_modules

USER node

CMD node server.js
