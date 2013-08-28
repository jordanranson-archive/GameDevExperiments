ig.module(
	'game.entities.fence'
)
.requires(
	'game.entities.3d'
)
.defines(function(){

EntityFence = Entity3d.extend({
    size: { x: 16, y: 16 },
    depth: 0.75,
    collides: ig.Entity.COLLIDES.FIXED,
    animSheet: new ig.AnimationSheet( 'media/fence.png', 16, 16 ),
    zIndex: 75,

    _wmScalable: true,
    _wmDrawBox: true,
    _wmBoxColor: 'rgba(200,200,200,0.7)',
    

    init: function( x, y, settings ) {
        this.parent( x, y, settings );

        if( this.direction === 'horizontal' ) {
            this.addAnim( 'idle', 1, [0] );
        }
        if( this.direction === 'vertical' ) {
            this.addAnim( 'idle', 1, [1] );
        }
    },
    
    
    ready: function() {
        
        // create the sphere's material        
        this.material = new THREE.MeshLambertMaterial({
            color: 0xc09868
        });

        var sizex = 2;
        var sizey = 2;

        if( this.direction === 'vertical' ) {
            sizey = this.size.y;
        }
        if( this.direction === 'horizontal' ) {
            sizex = this.size.x;
        }

        this.mesh = new THREE.Mesh(
            new THREE.CubeGeometry(
                sizex,
                sizey,
                3
            ),
            this.material
        );
        this.mesh.position.x = (this.pos.x + this.size.x*0.5);
        this.mesh.position.y = -(this.pos.y + this.size.y*0.5);
        this.mesh.position.z = 8;
        ig.game.scene.add( this.mesh );

        var mesh;
        if( this.direction === 'horizontal' ) {
            for( var i = 0; i < Math.round(this.size.x / window.tileSize); i++ ) {
                mesh = new THREE.Mesh(
                    new THREE.CubeGeometry(
                        4,
                        4,
                        16
                    ),
                    this.material
                );
                mesh.position.x = (this.pos.x + window.tileSize*0.25) + (window.tileSize*i);
                mesh.position.y = -(this.pos.y + this.size.y*0.5);
                mesh.position.z = 8;
                ig.game.scene.add( mesh );

                mesh = new THREE.Mesh(
                    new THREE.CubeGeometry(
                        4,
                        4,
                        16
                    ),
                    this.material
                );
                mesh.position.x = (this.pos.x + window.tileSize*0.75) + (window.tileSize*i);
                mesh.position.y = -(this.pos.y + this.size.y*0.5);
                mesh.position.z = 8;
                ig.game.scene.add( mesh );
            }
        }
        else if( this.direction === 'vertical' ) {
            for( var i = 0; i < Math.round(this.size.y / window.tileSize); i++ ) {
                mesh = new THREE.Mesh(
                    new THREE.CubeGeometry(
                        4,
                        4,
                        16
                    ),
                    this.material
                );
                mesh.position.x = (this.pos.x + this.size.x*0.5);
                mesh.position.y = -((this.pos.y + window.tileSize*0.25) + (window.tileSize*i));
                mesh.position.z = 8;
                ig.game.scene.add( mesh );

                mesh = new THREE.Mesh(
                    new THREE.CubeGeometry(
                        4,
                        4,
                        16
                    ),
                    this.material
                );
                mesh.position.x = (this.pos.x + this.size.x*0.5);
                mesh.position.y = -((this.pos.y + window.tileSize*0.75) + (window.tileSize*i));
                mesh.position.z = 8;
                ig.game.scene.add( mesh );
            }
        }
        else {
            mesh = new THREE.Mesh(
                new THREE.CubeGeometry(
                    4,
                    4,
                    16
                ),
                this.material
            );
            mesh.position.x = (this.pos.x + this.size.x*0.5);
            mesh.position.y = -(this.pos.y + this.size.y*0.5);
            mesh.position.z = 8;
            ig.game.scene.add( mesh );
        }
    },

    draw: function() {
        this.parent();
        if( this.direction === 'vertical' ) {
            for( var i = 0; i < Math.round(this.size.y / window.tileSize); i++ ) {
                this.currentAnim.draw(
                    this.pos.x - this.offset.x - ig.game._rscreen.x,
                    this.pos.y - this.offset.y - ig.game._rscreen.y + (window.tileSize*i)
                );
            }   
        }
        if( this.direction === 'horizontal' ) {
            for( var i = 0; i < Math.round(this.size.x / window.tileSize); i++ ) {
                this.currentAnim.draw(
                    this.pos.x - this.offset.x - ig.game._rscreen.x + (window.tileSize*i),
                    this.pos.y - this.offset.y - ig.game._rscreen.y
                );
            }   
        }
    }
});

});