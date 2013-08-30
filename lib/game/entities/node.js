ig.module(
	'game.entities.node'
)
.requires(
	'game.entities.3d',
    'game.enums'
)
.defines(function(){

EntityNode = Entity3d.extend({
    planeSize: { x: 64, y: 64 },
    size: { x: 64, y: 64 },
    offset: { x: 0, y: 0 },
    collides: ig.Entity.COLLIDES.PASSIVE,
    zIndex: 125,
    points: [
        [0,0,4],
        [4,0,2],
        [4,2,2],
        [6,2,1],
        [6,3,1],
    ],
    color: [ '#48cfad', '#37bc9b' ],
    _wmIgnore: false,
    _wmDrawBox: true,
    _wmBoxColor: 0x48cfad,
    
    
    init: function( x, y, settings ) {
        this.parent( x, y, settings );

        var c = (Math.random() * Object.keys(Colors).length-1) << 0;
        var i = 0;
        for( var key in Colors ) {
            if( i === c ) {
                this.color = Colors[key];
                break;
            }
            i++;
        }

        var cvs = ig.$new( 'Canvas' );
            cvs.width = this.size.x;
            cvs.height = this.size.y;
        var ctx = cvs.getContext( '2d' );

        for( var i = 0; i < this.points.length; i++ ) {
            var p = this.points[i];

            ctx.save();

            ctx.fillStyle = this.color[0];
            ctx.fillRect(
                p[0]*8, p[1]*8,
                (p[2]*8)-2, (p[2]*8)-2
            );

            ctx.fillStyle = this.color[1];

            ctx.moveTo( (p[0]*8), (p[1]*8)+((p[2]*8)-2) );
            ctx.lineTo( (p[0]*8)+(p[2]*8)-2, p[1]*8 );
            ctx.lineTo( (p[0]*8)+(p[2]*8)-2, (p[1]*8)+(p[2]*8)-2 );

            ctx.fill();

            ctx.restore();
        }

        this.imageData = cvs;
    },
    

    init3d: function() {
        console.log( this.imageData.toDataURL() );

        this.texture = new THREE.Texture( this.imageData );
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.LinearMipMapLinearFilter;

        this.mesh = new THREE.Mesh( 
            new THREE.PlaneGeometry( this.planeSize.x, this.planeSize.y ), 
            new THREE.MeshLambertMaterial({
                map: this.texture,
                transparent: true
            })
        );
        this.mesh.position.z = 16;

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
            this.mesh.position.x = (this.pos.x+(this.planeSize.x*0.5));
            this.mesh.position.y = -(this.pos.y+(this.planeSize.x*0.5));
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