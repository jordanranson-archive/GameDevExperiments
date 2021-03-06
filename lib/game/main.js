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

window.gameWidth = 256;
window.gameHeight = 192;
window.gameScale = 2;
window.tileSize = 16;

MyGame = ig.Game.extend({
    scene: null,
    renderer: null,
    camera: null,
    ground: [],
    player: null,
    clearColor: '#85bdea',
	
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
        
        // init 3d

        // set some camera attributes
        window.viewAngle = 40;
        window.aspectRatio = window.gameWidth / window.gameHeight;
        window.near = 0.1;
        window.far = 10000;

        // get the DOM element to attach to
        // - assume we've got jQuery to hand
        var $container = document.querySelector( 'body' );

        // create a WebGL renderer, camera
        // and a scene
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor( 0x85bdea );

        this.camera = new THREE.PerspectiveCamera(
            window.viewAngle,
            window.aspectRatio,
            window.near,
            window.far
        );
        this.camera.rotation.x = window.viewAngle * (Math.PI / 180);
        this.camera.position.z = 214;

        this.scene = new THREE.Scene();

        // add the camera to the scene
        this.scene.add( this.camera );

        // start the renderer
        this.renderer.setSize( window.gameWidth * window.gameScale, window.gameHeight * window.gameScale );

        // attach the render-supplied DOM element
        $container.appendChild( this.renderer.domElement );
        

        // load level
        this.loadLevel( LevelTest );


        // floor/ground
        var tilemap = this.backgroundMaps[0];
        var tilesize = tilemap.tilesize;
        var floorwidth = tilemap.width * tilesize;
        var floorheight = tilemap.height * tilesize;
        var chunk, image, texture, plane;

        // lighting
        var brightness = 0.95;
        var light = new THREE.AmbientLight( 0x101010 );
        this.scene.add( light );

        light = new THREE.PointLight( 0xCFCFCF, 0.7*brightness );
        light.position.set( floorwidth*.5, -floorheight*0.5, 500 );
        this.scene.add( light );

        light = new THREE.DirectionalLight( 0xCFCFCF, 0.45*brightness );
        light.position.set( 0, -floorheight*.5, 500 ).normalize();
        this.scene.add( light );

        light = new THREE.DirectionalLight( 0xCFCFCF, 0.3*brightness );
        light.position.set( -floorwidth*.8, -floorheight*0.5, 300 ).normalize();
        this.scene.add( light );

        light = new THREE.DirectionalLight( 0xCFCFCF, 0.3*brightness );
        light.position.set( floorwidth*.8, -floorheight*0.5, 300 ).normalize();
        this.scene.add( light );


        this.draw(); // hack

        // floor/ground cont.
        for( var y = 0; y < tilemap.preRenderedChunks.length; y++ ) {
            for( var x = 0; x < tilemap.preRenderedChunks[y].length; x++ ) {
                chunk = tilemap.preRenderedChunks[y][x];
                image = ig.$new( 'Image' );
                image.src = chunk.toDataURL();
                texture = new THREE.Texture( image );
                texture.magFilter = THREE.NearestFilter;
                texture.minFilter = THREE.LinearMipMapLinearFilter;
                texture.needsUpdate = true;

                plane = new THREE.Mesh( 
                    new THREE.PlaneGeometry( image.width/ig.system.scale, image.height/ig.system.scale ), 
                    new THREE.MeshLambertMaterial({
                        color: 0xFFFFFF,
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
        }
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

        var player = this.getEntitiesByType('EntityPlayer')[0];
        if( player ) {
            this.player = player;

            this.screen.x = (player.pos.x+(this.player.size.x*0.5)) - (ig.system.width*0.5);
            this.screen.y = (player.pos.y + (this.player.size.y*0.5)) - (ig.system.height*0.5);

            this.camera.position.x = player.pos.x + this.player.size.x*0.5;
            this.camera.position.y = -(ig.system.height) - player.pos.y + this.player.size.y*0.5;
        }
		
		// Add your own, additional update code here
	},
    
	
	draw: function() {
		// Draw all entities and backgroundMaps
		this.parent();
		
		// Add your own drawing code here
		
        this.renderer.render( this.scene, this.camera );
	}
});


// Start the Game with 60fps, a resolution of 320x240, scaled
// up by a factor of 2
ig.main( '#canvas', MyGame, 60, window.gameWidth, window.gameHeight, window.gameScale );

});
