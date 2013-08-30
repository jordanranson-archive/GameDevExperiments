ig.module( 
	'game.main' 
)
.requires(
	'impact.game',
	'impact.font',
    'impact.debug.debug',
    
    'game.levels.test'
)
.defines(function(){

__gameWidth = 256;
__gameHeight = 192;
__gameScale = 4;
__tileSize = 8;

MyGame = ig.Game.extend({
    scene: null,
    renderer: null,
    camera: null,
    ground: [],
    player: null,
    clearColor: '#222832',

    _3d: true,

	// Load a font
	font: new ig.Font( 'media/04b03.font.png' ),
	
	
	init: function() {
    
        // bind input
        ig.input.bind( ig.KEY.UP_ARROW, 'up' );
        ig.input.bind( ig.KEY.DOWN_ARROW, 'down' );
        ig.input.bind( ig.KEY.LEFT_ARROW, 'left' );
        ig.input.bind( ig.KEY.RIGHT_ARROW, 'right' );
        ig.input.bind( ig.KEY.W, 'cam_up' );
        ig.input.bind( ig.KEY.A, 'cam_left' );
        ig.input.bind( ig.KEY.S, 'cam_down' );
        ig.input.bind( ig.KEY.D, 'cam_right' );
        ig.input.bind( ig.KEY._1, 'zoom_in' );
        ig.input.bind( ig.KEY._2, 'zoom_out' );

        // TODO: level stuff
        this.spawnEntity( 'EntityCamera', 10, 10 );
        this.spawnEntity( 'EntityNode', 10, 10 );
        this.sortEntities();

        if( this._3d ) {
            this.init3d();
            for( var i = 0; i < this.entities.length; i++ ) this.entities[i].init3d();
        }
	},


    init3d: function() {

        // set some camera attributes
        __viewAngle = 40;
        __aspectRatio = __gameWidth / __gameHeight;
        __near = 0.1;
        __far = 10000;

        // get the DOM element to attach to
        // - assume we've got jQuery to hand
        var $container = document.querySelector( 'body' );

        // create a WebGL renderer, camera
        // and a scene
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor( 0x222832 );

        this.camera = new THREE.PerspectiveCamera(
            __viewAngle,
            __aspectRatio,
            __near,
            __far
        );
        this.camera.rotation.x = __viewAngle * (Math.PI / 180);
        this.camera.position.z = 74;

        this.scene = new THREE.Scene();

        // add the camera to the scene
        this.scene.add( this.camera );

        // start the renderer
        this.renderer.setSize( __gameWidth * __gameScale, __gameHeight * __gameScale );

        // attach the render-supplied DOM element
        $container.appendChild( this.renderer.domElement );


        // lighting
        var brightness = 0.95;
        var light = new THREE.AmbientLight( 0xFFFFFF );
        this.scene.add( light );

        // floor/ground
        /*var image = ig.$new( 'Canvas' );
        var ctx = image.getContext( '2d' );
            for( var i = 0; i < 256; i++ ) {

            }
        var texture = new THREE.Texture( image );
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( 2, 2 );
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.LinearMipMapLinearFilter;
            texture.needsUpdate = true;*/
        /*for( var y = 0; y < tilemap.preRenderedChunks.length; y++ ) {
            for( var x = 0; x < tilemap.preRenderedChunks[y].length; x++ ) {

                plane = new THREE.Mesh( 
                    new THREE.PlaneGeometry( image.width/ig.system.scale, image.height/ig.system.scale ), 
                    new THREE.MeshLambertMaterial({
                        color: 0xFFFFFF,
                        transparent: true,
                        map: texture
                    })
                );

                plane.position.x = ((tilemap.chunkSize/ig.system.scale)*x) + ((image.width/ig.system.scale)*0.5);
                plane.position.y = ((tilemap.chunkSize/ig.system.scale)*y) + (((image.height/ig.system.scale)*0.5));
                plane.position.y *= -1;
                plane.overdraw = true;

                this.ground.push( plane );
                this.scene.add( plane );
            }
        }*/
    },
    
	
	update: function() {
		// Update all entities and backgroundMaps
		this.parent();

        if( ig.input.pressed('zoom_in') ) {
            this.camera.position.z--;
            console.log(this.camera.position.z);
        }
        if( ig.input.pressed('zoom_out') ) {
            this.camera.position.z++;
            console.log(this.camera.position.z);
        }

        var camera = this.getEntitiesByType('EntityCamera')[0];
        if( camera ) {
            this.screen.x = (camera.pos.x + (camera.size.x*0.5)) - (ig.system.width*0.5);
            this.screen.y = (camera.pos.y + (camera.size.y*0.5)) - (ig.system.height*0.5);

            if( this._3d && this.camera && camera.mesh ) {
                this.camera.position.x = camera.pos.x + camera.size.x*0.5;
                this.camera.position.y = -(68 + camera.pos.y + camera.size.y*0.5);
                this.camera.position.z = 74+camera.mesh.position.z;
            }
        }
		
		// Add your own, additional update code here
	},
    
	
	draw: function() {
		// Draw all entities and backgroundMaps
		this.parent();
		
		// Add your own drawing code here

        if( this._3d && this.renderer ) {
            this.renderer.render( this.scene, this.camera );
        }
	}
});


// Start the Game with 60fps, a resolution of 320x240, scaled
// up by a factor of 2
ig.main( '#canvas', MyGame, 60, __gameWidth/2, __gameHeight/2, 4 );

});
