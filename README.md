# Cars micro-service

## Description

A little backend micro-service which aims to serve the cars data.
The API documentation is available [here](API.md) or [self-hosted](http://localhost:3000/api).

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ docker-compose up -d db redis
$ npm run start

# watch mode
$ docker-compose up -d db redis
$ npm run start:dev

# production mode
$ docker-compose up -d db redis
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ docker-compose up -d db redis
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

## Technical overview

This micro-service is mainly based on nestjs modules :
- crud
- bull
- swagger

It uses a MySQL database (not MongoDB because I got your answers too late and I already started using TypeORM) and a redis server required by bull module.

## Work summary

It was my first steps with TypeScript but not the lasts (same for nestjs).

NestJS is very powerful and I really enjoyed using it.

I decided to use nest CRUD to save time but it was not the case.
I had to implement ErrorTransformer and OrmErrorTransformer to manage constraints errors.

I could not perform as many unit tests as I would have liked, but the e2e test covers the different cases.

## Stay in touch

- Author - [Vincent GILLES](https://www.linkedin.com/in/vincent-g-a3a728190)
