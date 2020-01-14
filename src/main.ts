import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

// TODO Find how to import markdown file content
const apiDescription = '\
# Heading\n\
\n\
Text attributes _italic_, *italic*, __bold__, **bold**, \`monospace\`.\n\
\n\
Horizontal rule:\n\
\n\
---\n\
\n\
Bullet list:\n\
\n\
  * apples\n\
  * oranges\n\
  * pears\n\
  \n\
Numbered list:\n\
\n\
  1. apples\n\
  2. oranges\n\
  3. pears\n\
  \n\
A [link](http://example.com).\n\
\n\
An image:\n\
![Swagger logo](https://raw.githubusercontent.com/swagger-api/swagger-ui/master/dist/favicon-32x32.png)\n\
\n\
Code block:\n\
\n\
\`\`\`\n\
{\n\
  "message": "Hello, world!"\n\
}\n\
\`\`\`\n\
\n\
Tables:\n\
\n\
| Column1 | Collumn2 |\n\
| ------- | -------- |\n\
| cell1   | cell2    |';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const options = new DocumentBuilder()
    .setTitle('Cars Microservice')
    .setDescription(apiDescription)
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
