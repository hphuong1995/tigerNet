// let express = require( "express" );
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import session from "express-session";
import path from "path";

import { adminRoutes } from "./routes/adminRoutes";
import { authenticate } from "./routes/authenticate";
import { routes } from "./routes/routes";

const app = express();

// app.use(cors({
//     credentials: true,
//     exposedHeaders: ["CSRF"],
//     origin: [
//         "http://localhost:4200",
//         "http://localhost:3000"
//     ]
// }));
app.use(cors());
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( cookieParser() );
app.use( session( {
    cookie: {
        httpOnly: true,
        maxAge: 10 * 60 * 1000
    },
    resave: true,
    secret: "session string",
    saveUninitialized: true
} ) );

app.use( "/", express.static( path.join( __dirname, "../public" ) ) );
app.use( "/", authenticate );
app.use( "/api/v1/admin/", adminRoutes );
app.use( "/api/v1/", routes );

app.use( ( err: any, req: any, res: any, next: any ) => {
    res.status( err.status || 500 );
    res.send( { msg: err.message } );
} );

module.exports = app;
