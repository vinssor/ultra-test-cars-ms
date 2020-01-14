# Cars microservice

## Description

An [ULTRA](https://ultra.io) technical test based on [Nest](https://github.com/nestjs/nest) framework.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ docker-compose up -d db
$ npm run start

# watch mode
$ docker-compose up -d db
$ npm run start:dev

# production mode
$ docker-compose up -d db
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ docker-compose up -d db
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Running the app into docker

```bash
# production mode fg
$ docker-compose up

# production mode bg
$ docker-compose up -d
```

## API Document

API Documentation is available at http://localhost:3000/api

## Stay in touch

- Author - [Vincent GILLES](https://www.linkedin.com/in/vincent-g-a3a728190)
