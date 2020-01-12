import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CarModule } from './car/car.module';

async function bootstrap() {
  const app = await NestFactory.create(CarModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true
    })
  );

  const options = new DocumentBuilder()
    .setTitle('Cars example')
    .setDescription('The car API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
