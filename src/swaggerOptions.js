const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task API with Swagger',
      version: '1.0.0',
      description: 'A simple API to manage tasks',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['src/api.ts'], // files containing annotations as above
};

const specs = swaggerJsdoc(options);
module.exports = specs;
