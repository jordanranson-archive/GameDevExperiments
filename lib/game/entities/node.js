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
    color: [ '#48cfad', '#37bc9b' ],

    nodeSize: NodeSize.SMALL,
    baseDefense: 0,
    health: 0,
    defense: 0,
    attack: 0,
    productionRate: 0,
    threads: [],
    coreNode: true,
    team: null,
    state: NodeState.VACANT,

    _wmIgnore: false,
    _wmDrawBox: true,
    _wmBoxColor: 0x48cfad,

    
    init: function( x, y, settings ) {
        this.parent( x, y, settings );

        this.baseDefense = this.nodeSize+1;
        this.health = this.defense = this.baseDefense;

        // create threads for this node
        for( var i = 0; i < this.nodeSize; i++ ) {
            this.addThread( i );
            this.setThreadData( i, DataType.PRODUCTIVE, Math.random()*16 );
        }

        // set colors for team and generate initial texture
        this.setTeam( Math.round( Math.random()*9 ) );
    },
    

    init3d: function() {
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

        // add the plane to the scene
        var self = this;
        setTimeout( function() { 
            self.texture.needsUpdate = true;
            ig.game.scene.add( self.mesh );
        }, 0 );
    },


    generateTexture: function() {

        // Create the back buffer to create the texture in
        var cvs = ig.$new( 'Canvas' );
            cvs.width = this.size.x;
            cvs.height = this.size.y;
        var ctx = cvs.getContext( '2d' );

        // Draw node
        ctx.save();
        ctx.fillStyle = this.color[0];
        ctx.fillRect( 0, 0, 30, 30 );
        ctx.fillStyle = this.color[1];
        ctx.moveTo( 0, 30 );
        ctx.lineTo( 30, 0 );
        ctx.lineTo( 30, 30 );
        ctx.fill();
        if( this.coreNode ) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect( 0, 0, 28, 2 );
            ctx.fillRect( 28, 0, 2, 28 );
            ctx.fillRect( 2, 28, 28, 2 );
            ctx.fillRect( 0, 2, 2, 28 );
        }
        ctx.restore();

        // For every thread
        var thread, slot, grid = [];
        grid.reset = function() { while (this.length < 16) this.push(-1) };

        for( var i = 0; i < this.threads.length; i++ ) {
            grid.reset();
            thread = this._getThreadAtPos( i );

            for( var j = 0; j < thread.data.p; j++ ) {

                // try and group data in a way that will be conductive to cluster formation (2x2, 4x4)
                type = DataType.PRODUCTIVE;
                if( j <= 1 )              grid[ j+12 ] = type;
                if( j > 1  && j <= 3 )    grid[ j+6 ]  = type;
                if( j > 3  && j <= 5 )    grid[ j+10 ] = type;
                if( j > 5  && j <= 7 )    grid[ j+4 ]  = type;
                if( j > 7  && j <= 9 )    grid[ j-4 ]  = type;
                if( j > 9  && j <= 11 )   grid[ j-10 ] = type;
                if( j > 11 && j <= 13 )   grid[ j-6 ]  = type;
                if( j > 13 && j <= 15 )   grid[ j-12 ] = type;
            }
            console.log( thread.data.p, grid );
        }

        this.imageData = cvs;
        //console.log( this.imageData.toDataURL() );
    },


    setTeam: function( team ) {

        // set team color
        if( team === Team.RED )     this.color = Colors.RED;
        if( team === Team.ORANGE )  this.color = Colors.ORANGE;
        if( team === Team.YELLOW )  this.color = Colors.YELLOW;
        if( team === Team.GREEN )   this.color = Colors.GREEN;
        if( team === Team.TEAL )    this.color = Colors.TEAL;
        if( team === Team.AQUA )    this.color = Colors.AQUA;
        if( team === Team.BLUE )    this.color = Colors.BLUE;
        if( team === Team.PURPLE )  this.color = Colors.PURPLE;
        if( team === Team.PINK )    this.color = Colors.PINK;

        // generate the initial texture for this node
        this.generateTexture();

        // set team (duh!)
        this.team = team;
    },


    addThread: function( pos ) {
        var thread = {
            position: pos,
            production: ThreadProduction.NONE,
            data: {
                p: 0,
                d: 0,
                m: 0
            }
        };

        this.threads.push( thread );
    },


    setThreadProduction: function( pos, production ) {
        this._getThreadAtPos( pos ).production = production;
    },


    // TODO: clamp values
    changeThreadData: function( pos, type, amount ) {
        amount = Math.round( amount );

        if( this.type === DataType.PRODUCTIVE ) {
            this._getThreadAtPos( pos ).data.p += amount;
        }
        if( this.type === DataType.DEFENSIVE ) {
            this._getThreadAtPos( pos ).data.d += amount;
        }
        if( this.type === DataType.MALICIOUS ) {
            this._getThreadAtPos( pos ).data.m += amount;
        }
    },


    setThreadData: function( pos, type, amount ) {
        amount = Math.round( amount );

        if( this.type === DataType.PRODUCTIVE ) {
            this._getThreadAtPos( pos ).data.p = amount;
        }
        if( this.type === DataType.DEFENSIVE ) {
            this._getThreadAtPos( pos ).data.d = amount;
        }
        if( this.type === DataType.MALICIOUS ) {
            this._getThreadAtPos( pos ).data.m = amount;
        }
    },


    _getThreadAtPos: function( pos ) {

        // Is the list in order? Return the first result
        if( this.threads[pos] && pos === this.threads[pos].position ) {
            return this.threads[pos];
        }

        // List got mucked up, find that shit
        for( var i = 0; i < this.threads.length; i++ ) {
            if( pos === this.threads[i].position ) {
                return this.threads[i];
            }
        }

        return null; // no results found :(
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