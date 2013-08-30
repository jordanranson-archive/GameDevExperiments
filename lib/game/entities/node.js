ig.module(
	'game.entities.node'
)
.requires(
	'game.entities.3d'
)
.defines(function(){

EntityNode = Entity3d.extend({
    planeSize: { x: 32, y: 32 },
    size: { x: 32, y: 32 },
    offset: { x: 0, y: 0 },
    collides: ig.Entity.COLLIDES.PASSIVE,
    zIndex: 125,
    _wmIgnore: false,
    _wmDrawBox: true,
    _wmBoxColor: 0x48cfad,
    
    
    init: function( x, y, settings ) {
        this.parent( x, y, settings );

        var cvs = ig.$new( 'Canvas' );
        var ctx = cvs.getContext( '2d' );
            cvs.width = 32;
            cvs.height = 32;
            ctx.fillStyle = "#48cfad";
            ctx.fillRect(0,0,30,30);
            ctx.fillStyle = "#000000";
            ctx.fillRect(30,0,32,32);
            ctx.fillRect(0,30,32,32);

        this.imageData = cvs;
    },
    

    ready: function() {
        console.log( this.imageData.toDataURL() );

        this.texture = new THREE.Texture( this.imageData );
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.LinearMipMapLinearFilter;

        this.mesh = new THREE.Mesh( 
            new THREE.PlaneGeometry( this.planeSize.x-1, this.planeSize.y-1 ), 
            new THREE.MeshLambertMaterial({
                map: this.texture,
                transparent: true
            })
        );
        this.mesh.position.z = 1;

        // add the sphere to the scene
        var self = this;
        setTimeout( function() { 
            self.texture.needsUpdate = true;
            ig.game.scene.add( self.mesh );
        }, 0 );
    },

    
    update: function() {
        this.parent();
    },


    draw: function() {
        if( this.mesh ) {
            this.mesh.position.x = (this.pos.x+this.planeSize.x*0.5);
            this.mesh.position.y = -(this.pos.y+this.planeSize.x*0.5);
        }

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