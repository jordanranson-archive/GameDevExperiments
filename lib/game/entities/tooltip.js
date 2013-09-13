ig.module(
	'game.entities.tooltip'
)
.requires(
	'game.entities.3d',
    'game.enums'
)
.defines(function(){

EntityTooltip = Entity3d.extend({
    size: { x: 48, y: 16 },
    offset: { x: 0, y: 0 },
    collides: ig.Entity.COLLIDES.PASSIVE,
    zIndex: 125,
    
    init: function( x, y, settings ) {
        this.parent( x, y, settings );
        this.generateTexture();
    },
    

    init3d: function() {
        this.texture = new THREE.Texture( this.imageData );
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.NearestFilter;

        this.mesh = new THREE.Mesh( 
            new THREE.PlaneGeometry( this.size.x, this.size.y ), 
            new THREE.MeshBasicMaterial({
                map: this.texture,
                transparent: true
            })
        );

        this.mesh.position.z = 256+8;

        this.mesh._igEntity = this;

        // add the plane to the scene
        var self = this;
        setTimeout( function() { 
            self.texture.needsUpdate = true;
            ig.game.scene.add( self.mesh );
        }, 0 );
    },


    generateTexture: function() {
        var cvs = ig.$new( 'Canvas' );
            cvs.width = this.size.x;
            cvs.height = this.size.y;
        var ctx = cvs.getContext( '2d' );

        // Draw node
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect( 0, 0, this.size.x, this.size.y );
        ctx.restore();

        this.imageData = cvs;
    },


    hover: function( evt ) {
        /*var x, y, z;

        // node point
        x = this.mesh.position.x;
        y = this.mesh.position.y;
        z = this.mesh.position.z;
        ig.game.line.geometry.vertices[0].x = x;
        ig.game.line.geometry.vertices[0].y = y;
        ig.game.line.geometry.vertices[0].z = z;

        // cursor point
        var vector = new THREE.Vector3( 
            ( evt.x / __gameWidth ) * 2 - 1, 
            -( evt.y / __gameHeight ) * 2 + 1, 
            0.5 
        );
        ig.game.projector.unprojectVector( vector, ig.game.camera );
        x = vector.x;
        y = vector.y;
        z = vector.z;
        ig.game.line.geometry.vertices[1].x = x;
        ig.game.line.geometry.vertices[1].y = y;
        ig.game.line.geometry.vertices[1].z = z;

        ig.game.line.geometry.verticesNeedUpdate = true;*/
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