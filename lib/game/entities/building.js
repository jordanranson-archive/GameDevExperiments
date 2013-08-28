ig.module(
	'game.entities.building'
)
.requires(
	'game.entities.3d'
)
.defines(function(){

EntityBuilding = Entity3d.extend({
    size: { x: 16, y: 16 },
    collides: ig.Entity.COLLIDES.FIXED,
    zIndex: 100,
    
    _wmScalable: true,
    _wmDrawBox: true,
    _wmBoxColor: 'rgba(60,70,80,0.7)',
    

    init: function( x, y, settings ) {
        this.parent( x, y, settings );

        if( this.graphic ) {
            this.offset.y = 16;
            this.animSheet = new ig.AnimationSheet( 'media/'+this.graphic+'.png', this.size.x, this.size.y+window.tileSize );
            this.addAnim( 'idle', 1, [0] );
            console.log( this.size.x, this.size.y+window.tileSize );
        }
    },
    
    
    ready: function() {
        
        // create the sphere's material        
        this.material = new THREE.MeshLambertMaterial({
            color: 0x3c4650
        });

        if( this.graphic ) {
            var self = this;
            var loader = new THREE.ColladaLoader();
            loader.load( 'media/'+this.graphic+'.dae', function ( result ) {

                result.scene.position.set( self.pos.x, -(self.pos.y+self.size.y), 0 )
                result.scene.scale.set( 2.55, 2.55, 2.55 );

                ig.game.scene.add( result.scene )
                this.mesh = result.scene;
            });
        }
        else {
            this.mesh = new THREE.Mesh(
                new THREE.CubeGeometry(
                    this.size.x,
                    this.size.y,
                    this.depth*window.tileSize
                ),
                this.material
            );
            this.mesh.position.set( self.pos.x, -(self.pos.y+self.size.y), 0 )
            this.mesh.scale.set( 2.55, 2.55, 2.55 );

            ig.game.scene.add( this.mesh );
        }
    },
    
    
    update: function() {
        this.parent();
    }
});

});