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
    coreNode: false,
    team: null,
    state: NodeState.VACANT,

    // soon to be obsolete code
    points: [
        [0,0,4],
        [4,0,2],
        [4,2,2],
        [6,2,1],
        [6,3,1],
    ],

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

        // Generate that sucka' (temp code)
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

        console.log( this.imageData.toDataURL() );
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


    changeThreadData: function( pos, type, amount ) {
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