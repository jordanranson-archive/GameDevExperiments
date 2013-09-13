ig.module( 
	'game.main' 
)
.requires(
	'impact.game',
	'impact.font',
    'impact.debug.debug',
    
    'game.enums',
    'game.entities.camera',
    'game.entities.node',

    'levelgen.levelgen'
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
    networkChunks: [],
    networkPlanes: [],
    objects: [],
    level: null,
    levels: {
        duel: new ig.Image( 'media/levels/duel.png' )
    },
    player: null,
    clearColor: '#12171c',

    _3d: !ig.ua.iOS,

	// Load a font
	font: new ig.Font( 'media/04b03.font.png' ),
	
	
	init: function() {
    
        // bind input
        ig.input.initMouse();
        ig.input.bind( ig.KEY.MOUSE1, 'action1' );
        ig.input.bind( ig.KEY.MOUSE2, 'action2' );
        ig.input.bind( ig.KEY.MWHEEL_UP, 'scroll_up' );
        ig.input.bind( ig.KEY.MWHEEL_DOWN, 'scroll_down' );

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
        __viewAngle = 45;
        __aspectRatio = __gameWidth / __gameHeight;
        __near = 0.1;
        __far = 10000;

        // create a WebGL renderer, camera
        // and a scene
        this.projector = new THREE.Projector();
        this.renderer = new THREE.WebGLRenderer( { canvas: document.getElementById('canvas2') } );
        this.renderer.setClearColor( 0x12171c );
        this.renderer.sortObjects = false;

        this.camera = new THREE.PerspectiveCamera(
            __viewAngle,
            __aspectRatio,
            __near,
            __far
        );
        this.camera.rotation.x = __viewAngle * (Math.PI / 180);
        this.camera.position.z = 256;

        this.scene = new THREE.Scene();

        // add the camera to the scene
        this.scene.add( this.camera );

        // start the renderer
        this.renderer.setSize( __gameWidth * __gameScale, __gameHeight * __gameScale );

        // lighting
        var brightness = 0.95;
        var light = new THREE.AmbientLight( 0xFFFFFF );
        this.scene.add( light );
    },


    loadLevel: function( image ) {
        this.level = lg.Util.importLevel( image.originalData );

        var tilemapCvs = ig.$new( 'Canvas' );
            tilemapCvs.width = tilemapCvs.height = image.width*48;
        var tilemapCtx = tilemapCvs.getContext( '2d' );
        this.networkChunks = lg.Util.drawTilemap( this.level.tileMap, tilemapCtx );

        // spawn nodes
        var node;
        for( var y = 0; y < this.level.nodeMap.length; y++ ) {
            for( var x = 0; x < this.level.nodeMap[y].length; x++ ) {
                node = this.level.nodeMap[y][x];
                if( node !== '.' ) {
                    this.spawnEntity( 'EntityNode', x*48, y*48 );
                }
            }
        }
        this.sortEntities();

        if( this._3d ) {
            this.loadLevel3d();
        }
    },


    loadLevel3d: function() {

        // Create all 3d entities
        for( var i = 0; i < this.entities.length; i++ ) this.entities[i].init3d();

        // make the 3d planes
        var texture;
        for( var y = 0; y < this.networkChunks.length; y++ ) {
            for( var x = 0; x < this.networkChunks[y].length; x++ ) {
                texture = new THREE.Texture( this.networkChunks[y][x] );
                texture.magFilter = THREE.NearestFilter;
                texture.minFilter = THREE.NearestFilter;
                texture.needsUpdate = true;

                plane = new THREE.Mesh( 
                    new THREE.PlaneGeometry( 128, 128 ), 
                    new THREE.MeshBasicMaterial({
                        map: texture,
                        transparent: true
                    })
                );

                plane.position.x = (128*x) + (128*0.5);
                plane.position.y = (128*y) + (128*0.5);
                plane.position.y *= -1;
                plane.position.z = 256;
                plane.overdraw = true;

                this.networkPlanes.push( plane );
                this.scene.add( plane );
            }
        }
    },
    
	
	update: function() {
		// Update all entities and backgroundMaps
		this.parent();

        var camera = this.getEntitiesByType('EntityCamera')[0];
        if( camera ) {
            this.screen.x = (camera.pos.x + (camera.size.x*0.5)) - (ig.system.width*0.5);
            this.screen.y = (camera.pos.y + (camera.size.y*0.5)) - (ig.system.height*0.5);

            if( this._3d && this.camera && camera.mesh ) {
                this.camera.position.x = camera.pos.x + camera.size.x*0.5;
                this.camera.position.y = -(68 + camera.pos.y + camera.size.y*0.5);
                this.camera.position.z = camera.posz;
            }
        }

        // detect node click
        if( this._3d ) {
            var vector = new THREE.Vector3( 
                ( ig.input.mouse.x / __gameWidth ) * 2 - 1, 
                -( ig.input.mouse.y / __gameHeight ) * 2 + 1, 
                1 
            );

            this.projector.unprojectVector( vector, this.camera );
            var raycaster = new THREE.Raycaster( this.camera.position, vector.sub( this.camera.position ).normalize() );
            var intersects = raycaster.intersectObjects( this.objects );

            if ( intersects.length > 0 ) {
                var obj = intersects[0].object;
                if( obj._igEntity ) {
                    if( ig.input.pressed( 'action1' ) ) obj._igEntity.click();
                    else obj._igEntity.hover();
                }
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

ig.Input.inject({
    initMouse: function() {
        if( this.isUsingMouse ) { return; }
        this.isUsingMouse = true;
        var elem = document.getElementById( 'canvas2' );
        var mouseWheelBound = this.mousewheel.bind(this);

        elem.addEventListener('mousewheel', mouseWheelBound, false );
        elem.addEventListener('DOMMouseScroll', mouseWheelBound, false );
        
        elem.addEventListener('contextmenu', this.contextmenu.bind(this), false );
        elem.addEventListener('mousedown', this.keydown.bind(this), false );
        elem.addEventListener('mouseup', this.keyup.bind(this), false );
        elem.addEventListener('mousemove', this.mousemove.bind(this), false );
        
        if( ig.ua.touchDevice ) {
            // Standard
            elem.addEventListener('touchstart', this.keydown.bind(this), false );
            elem.addEventListener('touchend', this.keyup.bind(this), false );
            elem.addEventListener('touchmove', this.mousemove.bind(this), false );
            
            // MS
            elem.addEventListener('MSPointerDown', this.keydown.bind(this), false );
            elem.addEventListener('MSPointerUp', this.keyup.bind(this), false );
            elem.addEventListener('MSPointerMove', this.mousemove.bind(this), false );
            elem.style.msTouchAction = 'none';
        }
    },

    mousemove: function( event ) {   
        var elem = document.getElementById( 'canvas2' );   
        var internalWidth = parseInt(elem.offsetWidth) || __gameWidth*__gameScale;
        
        var pos = {left: 0, top: 0};
        if( elem.getBoundingClientRect ) {
            pos = elem.getBoundingClientRect();
        }
        
        var ev = event.touches ? event.touches[0] : event;
        this.mouse.x = (ev.clientX - pos.left) / __gameScale;
        this.mouse.y = (ev.clientY - pos.top) / __gameScale;
    }
});

ig.main( '#canvas', MyGame, 60, __gameWidth, __gameHeight, 4 );

});
