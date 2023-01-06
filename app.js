// dotenv
require("dotenv").config();
require("express-async-errors");

// express
const express = require("express");
const app = express();

// database
const connectDB = require("./db/connect");

// error handler
const errorHandlerMiddleware = require("./middleware/error-handler");
const CustomError = require("./errors");

// cookie parser
const cookieParser = require("cookie-parser");

// security package
const helmet = require("helmet");
const xss = require("xss-clean");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");

// vhost for subdomain handling
var vhost = require("vhost");

//  routers
const authRouter = require("./routes/authRoutes");
const brandRouter = require("./routes/brandRoutes");
const developerRouter = require("./routes/developerRoutes");

// middlewares
const notFoundMiddleware = require("./middleware/notFound");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.JWT_SECRET));

// middleware for security
app.use(helmet());
app.use(cors({origin: process.env.ORIGIN, credentials: true}));
app.use(xss());
app.use(mongoSanitize());

// routes
app.use("/auth", authRouter);
app.use(vhost(`*.${process.env.DOMAIN_NAME}`, brandRouter));
app.use("/developer", developerRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);
    const server = app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
    server.on("error", function (e) {
      throw new CustomError.CustomAPIError("The port is busy");
    });
  } catch (error) {
    throw new CustomError.CustomAPIError("Could not establish a connection");
  }
};

start();
