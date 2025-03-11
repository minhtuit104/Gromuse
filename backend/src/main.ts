import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Sử dụng Global Validation Pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('Gromuse API')
    .setDescription('API documentation for Gromuse application')
    .setVersion('1.0')
    .addTag('Accounts')
    .addTag('Auth')
    .addTag('Products') 
    .addTag('Cart')
    .addTag('Users')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Gromuse API Documentation',
  });

  const corsOptions: CorsOptions = { 
    origin: 'http://localhost:5173', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', 
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization', 
    exposedHeaders: 'Authorization', 
    maxAge: 3600, 
  };
  app.enableCors(corsOptions);

  const port = process.env.PORT ?? 3000; 
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();