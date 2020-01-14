FROM node:lts

RUN mkdir -p /opt/cars-ms
WORKDIR /opt/cars-ms
COPY ./*.json /opt/cars-ms/
RUN npm ci
COPY ./src /opt/cars-ms/src
RUN npm run prebuild
RUN npm run build

EXPOSE 3000
CMD [ "npm", "run", "start:prod" ]
