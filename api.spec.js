//. api.spec.js

var request = require( 'supertest' ),
    chai = require( 'chai' ),
    app = require( './app' );

chai.should();

describe( 'POST item, GET item, UPDATE item, DELETE item', function(){
  it( 'should work as expected', async function(){
    this.timeout( 10000 );  //. 以下全てを 10s 以内で行う

    var result1 = await request( app ).post( '/api/db/item' ).send( { name: 'シャンプー', price: 500 } );
    var item_id = result1.body.id;
    result1.body.status.should.equal( true );
    result1.statusCode.should.equal( 200 );

    var result2 = await request( app ).get( '/api/db/item/' + item_id );
    result2.statusCode.should.equal( 200 );
    result2.body.status.should.equal( true );
    result2.body.item.price.should.equal( 500 );

    var result3 = await request( app ).put( '/api/db/item/' + item_id ).send( { name: 'シャンプー', price: 600 } );
    result3.body.status.should.equal( true );
    result3.statusCode.should.equal( 200 );

    var result4 = await request( app ).get( '/api/db/item/' + item_id );
    result4.statusCode.should.equal( 200 );
    result4.body.status.should.equal( true );
    result4.body.item.price.should.equal( 600 );
    console.log( 4 );

    var result5 = await request( app ).delete( '/api/db/item/' + item_id );
    result5.statusCode.should.equal( 200 );
    result5.body.status.should.equal( true );
    console.log( 5 );

    var result6 = await request( app ).get( '/api/db/item/' + item_id );
    result6.statusCode.should.equal( 400 );
    result6.body.status.should.equal( false );
    console.log( 6 );

    /*
    var result900 = await request( app ).delete( '/api/db/items' );
    result900.statusCode.should.equal( 200 );
    result900.body.status.should.equal( true );
    */
  });
});
