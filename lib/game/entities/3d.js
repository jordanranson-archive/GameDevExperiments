ig.module(
	'game.entities.3d'
)
.requires(
	'impact.entity'
)
.defines(function(){

Entity3d = ig.Entity.extend({
    size: { x: 16, y: 16 },
    depth: 16,
    
    
    init: function( x, y, settings ) {
        this.parent( x, y, settings );
    },
    
    
    ready: function() {
        
        // set up the sphere vars
        var radius = this.size.x*0.5,
            segments = 16,
            rings = 16;
        
        // create the sphere's material        
        this.material = new THREE.MeshLambertMaterial({
            color: 0xCC0000
        });

        // create a new mesh with
        // sphere geometry - we will cover
        // the sphereMaterial next!
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(
                radius,
                segments,
                rings
            ),
            this.material
        );
        this.mesh.position.x = (this.pos.x + this.size.x*0.5);
        this.mesh.position.y = -(this.pos.y + this.size.y*0.5);
        this.mesh.position.z = this.size.x*0.5;

        // add the sphere to the scene
        ig.game.scene.add( this.mesh );
    }
});

});