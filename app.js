//. app.js
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    ejs = require( 'ejs' ),
    app = express();

var db = require( './api/db' );
app.use( '/api/db', db );

app.use( bodyParser.urlencoded( { extended: true, limit: '50mb' } ) );
app.use( bodyParser.json( { limit: '50mb' }) );
app.use( express.static( __dirname + '/public' ) );
app.use( express.Router() );
app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );

app.get( '/', async function( req, res ){
  var r = await db.readItems();
  if( r && r.status ){
    res.render( 'index', { items: r.items } );
  }else{
    res.render( 'index', { items: [] } );
  }
});


var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );

module.exports = app;
