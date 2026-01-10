FROM node:25-alpine

WORKDIR /etc/buildtheearth/main-bot

COPY . ./

RUN npm install

RUN npm start build

ENV NODE_ENV production

ENV FORCE_COLOR 1

ENV IN_DOCKER yes

#Please edit this to your images webserver port
#EXPOSE 8080
CMD ["node", "--max-old-space-size=4096", "--inspect=0.0.0.0:9229", "dist/index.js"]
#CMD ["sh", "scripts/dumb.sh"]
