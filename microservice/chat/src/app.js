const createError = require("http-errors");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const http = require("http");
const logger = require("./utils/logger");
const apiRouter = require("./routes");
const connectMongo = require("./utils/mongo");
const { startResponseConsumer } = require('./workers/responseConsumer');
const { initSocketIO } = require("./config/socket");

module.exports = (app) => {
    app.set('trust proxy', 1);

    // Session
    app.use(
        session({
            secret: process.env.SESSION_SECRET || "default_secret",
            resave: false,
            saveUninitialized: false,
        })
    );

    // Body parser
    app.use(express.json({ limit: "100mb" }));
    app.use(express.urlencoded({ extended: true, limit: "100mb" }));
    app.use(cookieParser());
    // app.use(bodyParser.json());

    // CORS
    const corsOptions = {
        origin: function (origin, callback) {
            return callback(null, true);
        },
        credentials: true,
        optionsSuccessStatus: 200,
    };
    app.use(cors(corsOptions));

    // Logger
    app.use((req, res, next) => {
        logger.info(`${req.method} ${req.url}`);
        next();
    });

    connectMongo();
    startResponseConsumer();

    // Routes
    app.use("/api/v1", apiRouter);

    // 404 error handler
    app.use((req, res, next) => {
        next(createError(404, "Resource not found"));
    });

    const server = http.createServer(app);
    initSocketIO(server);

    const port = process.env.PORT || 3003;
    server.listen(port, () => {
        logger.info(`Server is listening on port ${port}`);
    });

    return server;
};