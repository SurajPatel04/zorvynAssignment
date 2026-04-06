import swaggerAutogen from "swagger-autogen";

const doc = {
    info: {
        title: "Zorvyn Finance API",
        version: "1.0.0",
        description: "Role-based financial management API",
    },
    servers: [
        {
            url: "https://zorvynassignment-swwh.onrender.com",
            description: "Production Server"
        },
        {
            url: "http://localhost:8000",
            description: "Local Development Server"
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
    },
};

const outputFile = "./swagger-output.json";
const routes = ["./src/app.ts"];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, routes, doc);