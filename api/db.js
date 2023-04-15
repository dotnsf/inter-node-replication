//. db.js
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    mqtt = require( 'mqtt' ),
    { v4: uuidv4 } = require( 'uuid' ),
    api = express();

require( 'dotenv' ).config();
var mqtt_url = 'MQTT_URL' in process.env ? process.env.MQTT_URL : ''; 
var mqtt_port = 'MQTT_PORT' in process.env ? process.env.MQTT_PORT : 1880; 
var mqtt_topic = 'MQTT_TOPIC' in process.env ? process.env.MQTT_TOPIC : ''; 

var mqtt_pub = null;
var mqtt_sub = null;
if( mqtt_url && mqtt_port && mqtt_topic ){
  mqtt_pub = mqtt.connect( mqtt_url, { port: mqtt_port } );
  mqtt_sub = mqtt.connect( mqtt_url, { port: mqtt_port } );

  mqtt_sub.on( 'connect', function(){
    mqtt_sub.subscribe( mqtt_topic );
  });

  mqtt_sub.on( 'message', async function( topic, message ){
    var data = JSON.parse( message.toString() );
    var item = data.item;
    var item_id = item.id;
    var r = await api.readItem( item_id );
    if( r && r.status ){
    }else{
      //. 自身にないデータだった
      await api.createItem( item );
    }
  });
}

var _items = [];

var settings_cors = 'CORS' in process.env ? process.env.CORS : '';
api.all( '/*', function( req, res, next ){
  if( settings_cors ){
    res.setHeader( 'Access-Control-Allow-Origin', settings_cors );
    res.setHeader( 'Access-Control-Allow-Methods', '*' );
    res.setHeader( 'Access-Control-Allow-Headers', '*' );
    res.setHeader( 'Vary', 'Origin' );
  }
  next();
});

api.use( bodyParser.urlencoded( { extended: true, limit: '50mb' } ) );
api.use( bodyParser.json( { limit: '50mb' }) );
api.use( express.Router() );

//. Create
api.createItem = async function( item ){
  return new Promise( async ( resolve, reject ) => {
    var id = uuidv4();
    if( item.id ){ 
      id = item.id; 
    }else{
      item.id = id;
    }

    var r = await api.readItem( item.id );
    if( r && r.status ){
      resolve( { status: false, error: 'duplicated id.' } );
    }else{
      var t = ( new Date() ).getTime();
      item.created = t;
      item.updated = t;
      _items.unshift( item );

      if( mqtt_pub ){
        mqtt_pub.publish( mqtt_topic, JSON.stringify( { method: 'createItem', item: item } ) )
      }

      resolve( { status: true, id: item.id, item: item } );
    }
  });
};

//. Read
api.readItem = async function( id ){
  return new Promise( async ( resolve, reject ) => {
    if( id ){
      var item = null;
      for( var i = 0; i < _items.length && !item; i ++ ){
        if( _items[i].id == id ){
          item = _items[i];
        }
      }
      if( item ){
        resolve( { status: true, id: id, item: item } );
      }else{
        resolve( { status: false, error: 'no item found for id = ' + id + '.' } );
      }
    }else{
      resolve( { status: false, error: 'no id provided.' } );
    }
  });
};

//. Reads
api.readItemIndex = async function( id ){
  return new Promise( async ( resolve, reject ) => {
    if( id ){
      var idx = -1;
      for( var i = 0; i < _items.length && idx == -1; i ++ ){
        if( _items[i].id == id ){
          idx = i;
        }
      }
      if( idx > -1 ){
        resolve( { status: true, id: id, index: idx, item: _items[idx] } );
      }else{
        resolve( { status: false, error: 'no item found for id = ' + id + '.' } );
      }
    }else{
      resolve( { status: false, error: 'no id provided.' } );
    }
  });
};

api.readItems = async function( limit, offset ){
  return new Promise( async ( resolve, reject ) => {
    limit = ( limit ? limit : 0 );
    offset = ( offset ? offset : 0 );
    var items = JSON.parse( JSON.stringify( _items ) );
    if( limit || offset ){
      items = items.slice( offset, offset + limit );
    }
    resolve( { status: true, limit: limit, offset: offset, items: items } );
  });
};

//. Update
api.updateItem = async function( item ){
  return new Promise( async ( resolve, reject ) => {
    if( item && item.id ){
      var r = await api.readItemIndex( item.id );
      if( r && r.status ){
        _items[r.index] = item;
        resolve( { status: true, idx: idx } );
      }else{
        resolve( { status: false, error: 'no item found for id = ' + item.id + '.' } );
      }
    }else{
      resolve( { status: false, error: 'no item and/or item.id provided.' } );
    }
  });
};

//. Delete
api.deleteItem = async function( id ){
  return new Promise( async ( resolve, reject ) => {
    if( id ){
      var r = await api.readItemIndex( id );
      if( r && r.status ){
        _items.splice( r.index, 1 );
        resolve( { status: true, id: id } );
      }else{
        resolve( { status: false, error: 'no item found for id = ' + id + '.' } );
      }
    }else{
      resolve( { status: false, error: 'no id provided.' } );
    }
  });
};

api.deleteItems = async function(){
  return new Promise( async ( resolve, reject ) => {
    _items = [];
    resolve( { status: true } );
  });
};


api.post( '/item', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var item = req.body;
  api.createItem( item ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/item/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var id = req.params.id;
  api.readItem( id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/items', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var limit = req.query.limit ? parseInt( limit ) : 0;
  var offset = req.query.offset ? parseInt( offset ) : 0;
  api.readItems( limit, offset ).then( function( results ){
    res.status( results.status ? 200 : 400 );
    res.write( JSON.stringify( results, null, 2 ) );
    res.end();
  });
});

api.put( '/item/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var id = req.params.id;
  var item = req.body;
  item.id = id;
  api.updateItem( item ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.delete( '/item/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var id = req.params.id;
  api.deleteItem( id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.delete( '/items', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  api.deleteItems().then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});


//. api をエクスポート
module.exports = api;
