"use strict";
// var __importDefault = (this && this.__importDefault) || function (mod) {
//     return (mod && mod.__esModule) ? mod : { "default": mod };
// };

Object.defineProperty(exports, "__esModule", { value: true });
let app = require( "../dist/app" );
const http = require( "http" );
// const http = __importDefault(require("http"));
// const app = __importDefault(require("../app"));
// const debug = require( "debug" )( "app:server" );
// const debug = __importDefault(require("debug"));

// var app = require( './app' );
// var http = require( 'http' );


var debug = require( 'debug' )( 'app:server' );

/*
 * Set server to port 3000
 */
var port = 3000;
app.set( 'port', port );

/*
 * Create HTTP server.
 */
var server = http.createServer( app );

/*
 * Listen on provided port.
 */
server.listen( port );

/*
 * Normalize port into a number, string, or false.
 */

server.on( 'listening', onListening );

server.on( 'error', onError );

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    debug( 'Listening on ' + bind );
}
function onError( error ) {
    if ( error.syscall !== 'listen' ) {
        throw error;
    }

    var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

    switch ( error.code ) {
        case 'EACCES':
            console.error( bind + ' requires elevated privileges' );
            process.exit( 1 );
            break;
        case 'EADDRINUSE':
            console.error( bind + ' is already in use' );
            process.exit( 1 );
            break;
        default:
            throw error;
    }
}
