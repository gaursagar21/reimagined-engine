const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task API with Swagger',
      version: '1.0.0',
      description: 'DFL Worker Management API',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['src/api.ts'],
};

const specs = swaggerJsdoc(options);
module.exports = specs;
