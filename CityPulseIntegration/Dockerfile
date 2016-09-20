FROM node:latest
MAINTAINER thomas.gilbert@alexandra.dk

RUN mkdir -p /opt/prs/app
WORKDIR /opt/prs/app

COPY . /opt/prs/app

RUN npm install

CMD [ "npm", "start" ]

EXPOSE 8001
