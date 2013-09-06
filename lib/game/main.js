ig.module( 
	'game.main' 
)
.requires(
	'impact.game',
	'impact.font',
    'impact.debug.debug',
    
    'game.enums',
    'game.entities.camera',
    'game.entities.node'
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
    levels: {
        duel: new ig.Image( 'media/levels/duel.png' )
    },
    player: null,
    clearColor: Colors.GRAY[3],

    _3d: !ig.ua.iOS,

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

        // create the camera
        this.spawnEntity( 'EntityCamera', 128, 128 );

        // initiate all the 3d stuff if enabled
        if( this._3d ) {
            this.init3d();
            for( var i = 0; i < this.entities.length; i++ ) this.entities[i].init3d();
        }

        // load er up
        this.loadLevel( this.levels.duel );
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
        this.renderer.setClearColor( 0x171c21 );
        this.renderer.sortObjects = false;

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
    },


    loadLevel: function( image ) {
        var imgToCvs = function( image ) {
            var cvs = ig.$new( 'Canvas' );
                cvs.width = cvs.height = image.width;

            var ctx = cvs.getContext( '2d' );
                ctx.drawImage( image.data, 0, 0, image.width, image.height );

            return cvs;
        };

        var canvas = imgToCvs( image );
        // TODO: load tilemap

        // generate bg image
        // TODO: create large tiles from tilemap
        var image = ig.$new( 'Canvas' );
            image.width = 8;
            image.height = 8;
        var ctx = image.getContext( '2d' );
            ctx.fillStyle = Colors.GRAY[3];
            ctx.fillRect( 0, 0, 8, 8 );
            ctx.fillStyle = Colors.GRAY[2];
            ctx.fillRect( 0, 0, 1, 1 );
        this.bgData = image;

        // spawn nodes
        this.spawnEntity( 'EntityNode', 128, 128 );
        this.sortEntities();

        if( this._3d ) {
            this.loadLevel3d();
        }
    },


    loadLevel3d: function() {

        // Create all 3d entities
        for( var i = 0; i < this.entities.length; i++ ) this.entities[i].init3d();

        // floor/ground
        var levelWidth = 256;
        var levelHeight = 256;

        // generate the grid texture
        var texture = new THREE.Texture( this.bgData );
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set( 32, 32 );
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.LinearMipMapLinearFilter;
            texture.needsUpdate = true;

        // make the 3d planes
        for( var y = 0; y < levelHeight/256; y++ ) {
            for( var x = 0; x < levelWidth/256; x++ ) {
                plane = new THREE.Mesh( 
                    new THREE.PlaneGeometry( 256, 256 ), 
                    new THREE.MeshLambertMaterial({
                        map: texture
                    })
                );

                plane.position.x = (256*x) + (256*0.5);
                plane.position.y = (256*y) + (256*0.5);
                plane.position.y *= -1;
                plane.position.z = 0;
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
        // TODO: draw tilemap

        this.parent();

        if( this._3d && this.renderer ) {
            this.renderer.render( this.scene, this.camera );
        }
	}
});


ig.Image.inject({
    resize: function( scale ) {
        var origPixels = ig.getImagePixels( this.data, 0, 0, this.width, this.height );
        
        var widthScaled = this.width * scale;
        var heightScaled = this.height * scale;

        var scaled = ig.$new('canvas');
        scaled.width = widthScaled;
        scaled.height = heightScaled;
        var scaledCtx = scaled.getContext('2d');
        var scaledPixels = scaledCtx.getImageData( 0, 0, widthScaled, heightScaled );
            
        for( var y = 0; y < heightScaled; y++ ) {
            for( var x = 0; x < widthScaled; x++ ) {
                var index = (Math.floor(y / scale) * this.width + Math.floor(x / scale)) * 4;
                var indexScaled = (y * widthScaled + x) * 4;
                scaledPixels.data[ indexScaled ] = origPixels.data[ index ];
                scaledPixels.data[ indexScaled+1 ] = origPixels.data[ index+1 ];
                scaledPixels.data[ indexScaled+2 ] = origPixels.data[ index+2 ];
                scaledPixels.data[ indexScaled+3 ] = origPixels.data[ index+3 ];
            }
        }
        scaledCtx.putImageData( scaledPixels, 0, 0 );
        this.originalData = this.data;
        this.data = scaled;
    },
});


// Start the Game with 60fps, a resolution of 320x240, scaled
// up by a factor of 2
ig.main( '#canvas', MyGame, 60, __gameWidth/2, __gameHeight/2, 3 );

});
