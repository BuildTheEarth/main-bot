FROM node:16-alpine3.15

WORKDIR /etc/buildtheearth/main-bot

COPY . ./

RUN npm install

RUN npm start build

ENV NODE_ENV production

ENV FORCE_COLOR 1

ENV IN_DOCKER yes

#Please edit this to your images webserver port
#EXPOSE 8080
CMD ["node", "dist/index.js"]
