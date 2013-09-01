ig.module(
	'game.entities.network'
)
.requires(
	'game.entities.3d',
    'game.enums'
)
.defines(function(){

EntityNetwork = Entity3d.extend({
    size: { x: 80, y: 80 },
    offset: { x: 0, y: 0 },
    collides: ig.Entity.COLLIDES.PASSIVE,
    zIndex: 125,

    damaged: false,
    direction: 0,

    
    init: function( x, y, settings ) {
        this.parent( x, y, settings );

        this.generateTexture();
    },
    

    init3d: function() {
        this.texture = new THREE.Texture( this.imageData );
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.LinearMipMapLinearFilter;

        this.mesh = new THREE.Mesh( 
            new THREE.PlaneGeometry( this.size.x, this.size.y ), 
            new THREE.MeshLambertMaterial({
                map: this.texture,
                transparent: true
            })
        );
        this.mesh.position.x = (this.pos.x+(this.size.x*0.5));
        this.mesh.position.y = -(this.pos.y+(this.size.y*0.5));
        this.mesh.position.z = 12;

        // add the plane to the scene
        var self = this;
        setTimeout( function() {
            self.texture.needsUpdate = true;
            ig.game.scene.add( self.mesh );
        }, 0 );
    },


    generateTexture: function() {

        // Create the back buffer to create the texture in
        var cvs = ig.$new( 'Canvas' );
            cvs.width = this.size.x;
            cvs.height = this.size.y;
        var ctx = cvs.getContext( '2d' );

        // Draw network
        ctx.fillStyle = '#242e3b';
        if( this.direction === NetworkDir.HORZ ) ctx.fillRect( 0, 38, this.size.x, 3 );
        if( this.direction === NetworkDir.VERT ) ctx.fillRect( 38, 0, 3, this.size.y );
        if( this.direction === NetworkDir.NE ) {
            ctx.fillRect( 38, 38, 38, 3 );
            ctx.fillRect( 38, 0, 3, 38 );
        }
        if( this.direction === NetworkDir.NW ) {
            ctx.fillRect( 0, 38, 38, 3 );
            ctx.fillRect( 38, 0, 3, 38 );
        }
        if( this.direction === NetworkDir.SE ) {
            ctx.fillRect( 38, 38, 38, 3 );
            ctx.fillRect( 38, 38, 3, 38 );
        }
        if( this.direction === NetworkDir.SW ) {
            ctx.fillRect( 0, 38, 38, 3 );
            ctx.fillRect( 38, 38, 3, 38 );
        }
        if( this.direction === NetworkDir.HORZ_N ) {
            ctx.fillRect( 0, 38, this.size.x, 3 );
            ctx.fillRect( 38, 0, 3, 38 );
        }
        if( this.direction === NetworkDir.HORZ_S ) {
            ctx.fillRect( 0, 38, this.size.x, 3 );
            ctx.fillRect( 38, 38, 3, 38 );
        }
        if( this.direction === NetworkDir.VERT_E ) {
            ctx.fillRect( 38, 0, 3, this.size.y );
            ctx.fillRect( 38, 38, 38, 3 );
        }
        if( this.direction === NetworkDir.VERT_W ) {
            ctx.fillRect( 38, 0, 3, this.size.y );
            ctx.fillRect( 0, 38, 38, 3 );
        }
        if( this.direction === NetworkDir.CROSS ) {
            ctx.fillRect( 38, 0, 3, this.size.y );
            ctx.fillRect( 0, 38, this.size.x, 3 );
        }

        if( this.damaged ) {
            ctx.fillStyle = '#f00';
            ctx.fillRect( 37, 37, 5, 5 );
        }


        this.imageData = cvs;
        console.log( this.imageData.toDataURL() );
    },

    
    update: function() {
        this.parent();
    },


    draw: function() {
        ig.system.context.drawImage( 
            this.imageData, 
            ig.system.getDrawPos(this.pos.x-ig.game.screen.x), 
            ig.system.getDrawPos(this.pos.y-ig.game.screen.y),
            ig.system.getDrawPos(this.size.x),
            ig.system.getDrawPos(this.size.y)
        );

        this.parent();
    }
});

});