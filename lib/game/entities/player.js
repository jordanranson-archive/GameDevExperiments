ig.module(
	'game.entities.player'
)
.requires(
	'game.entities.3d'
)
.defines(function(){

EntityPlayer = Entity3d.extend({
    planeSize: { x: 16, y: 16 },
    size: { x: 16, y: 16 },
    offset: { x: 0, y: 0 },
    depth: 32,
    collides: ig.Entity.COLLIDES.PASSIVE,
    animSheet: new ig.AnimationSheet( 'media/entity.png', 16, 16 ),
    zIndex: 150,
    lastAnim: null,
    
    
    init: function( x, y, settings ) {
        // Add animations for the animation sheet
        this.addAnim( 'idle', 1, [0] );
        
        // Call the parent constructor
        this.parent( x, y, settings );
    },
    

    ready: function() {
        this.texture = new THREE.Texture( this.getCurrentAnimData() );
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.LinearMipMapLinearFilter;

        var mesh = this.mesh = new THREE.Mesh( 
            new THREE.PlaneGeometry( this.planeSize.x, this.planeSize.y ), 
            new THREE.MeshLambertMaterial({
                map: this.texture,
                transparent: true
            })
        );
        this.mesh.doubleSided = true;
        this.mesh.position.z = 1;

        // add the sphere to the scene
        var self = this;
        setTimeout( function() { 
            self.texture.needsUpdate = true;
            ig.game.scene.add( mesh );
        }, 0 );

        this.lastAnim = this.currentAnim;
    },


    getCurrentAnimData: function() {
        var canvas = ig.$new( 'Canvas' );
            canvas.width = this.planeSize.x*ig.system.scale;
            canvas.height = this.planeSize.y*ig.system.scale;

        var context = canvas.getContext( '2d' );
        var image = this.currentAnim.sheet.image;

        var targetX = 0;
        var targetY = 0; 
        var tile = this.currentAnim.tile;
        var tileWidth = this.planeSize.x; 
        var tileHeight = this.planeSize.y; 
        var flipX = false; 
        var flipY = false;

        tileHeight = tileHeight ? tileHeight : tileWidth;
        
        if( !image.loaded || tileWidth > image.width || tileHeight > image.height ) { return; }
        
        var scale = ig.system.scale;
        var tileWidthScaled = Math.floor(tileWidth * scale);
        var tileHeightScaled = Math.floor(tileHeight * scale);
        
        var scaleX = flipX ? -1 : 1;
        var scaleY = flipY ? -1 : 1;
        
        if( flipX || flipY ) {
            context.save();
            context.scale( scaleX, scaleY );
        }
        context.drawImage( 
            image.data, 
            ( Math.floor(tile * tileWidth) % image.width ) * scale,
            ( Math.floor(tile * tileWidth / image.width) * tileHeight ) * scale,
            tileWidthScaled,
            tileHeightScaled,
            ig.system.getDrawPos(targetX) * scaleX - (flipX ? tileWidthScaled : 0), 
            ig.system.getDrawPos(targetY) * scaleY - (flipY ? tileHeightScaled : 0),
            tileWidthScaled,
            tileHeightScaled
        );
        if( flipX || flipY ) {
            context.restore();
        }
        
        ig.Image.drawCount++;

        return canvas;
    },
    
    
    update: function() {

        // move player on key input
        this.vel.x = 0;
        if( ig.input.state( 'right' ) ) {
            this.vel.x = 70;
        }
        if( ig.input.state( 'left' ) ) {
            this.vel.x = -70;
        }
        this.vel.y = 0;
        if( ig.input.state( 'up' ) ) {
            this.vel.y = -70;
        }
        if( ig.input.state( 'down' ) ) {
            this.vel.y = 70;
        }

        this.parent();

        // get new texture slice if frame or animation changed
        if( this.lastAnim !== this.currentAnim || this.lastAnimTile !== this.currentAnim.tile ) {
            if( this.texture ) {
                this.texture.image = this.getCurrentAnimData();
                this.texture.needsUpdate = true;
            }
        }
        this.lastAnim = this.currentAnim;
        this.lastAnimTile = this.currentAnim.tile;
    },


    draw: function() {
        if( this.mesh ) {
            this.mesh.position.x = (this.pos.x+this.planeSize.x*0.5);
            this.mesh.position.y = -(this.pos.y+this.planeSize.x*0.5);
        }

        this.parent();
    }
});

});