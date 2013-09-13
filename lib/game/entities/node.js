ig.module(
	'game.entities.node'
)
.requires(
	'game.entities.3d',
    'game.enums'
)
.defines(function(){

EntityNode = Entity3d.extend({
    size: { x: 48, y: 48 },
    offset: { x: 0, y: 0 },
    collides: ig.Entity.COLLIDES.PASSIVE,
    zIndex: 125,
    color: [ '#cccccc', '#aaaaaa' ],

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

    
    init: function( x, y, settings ) {
        this.parent( x, y, settings );

        this.baseDefense = this.nodeSize+1;
        this.health = this.defense = this.baseDefense;

        // create threads for this node
        for( var i = 0; i < this.nodeSize; i++ ) {
            this.addThread( i );
            /*
            this.setThreadData( i, DataType.PRODUCTIVE, Math.random()*7 );
            this.setThreadData( i, DataType.DEFENSIVE, Math.random()*5 );
            this.setThreadData( i, DataType.MALICIOUS, Math.random()*4 );
            */
        }

        // set colors for team and generate initial texture
        this.setTeam( Team.NONE );
        //this.setTeam( Math.round( Math.random()*9 ) );
    },
    

    init3d: function() {
        this.texture = new THREE.Texture( this.imageData );
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.NearestFilter;

        this.mesh = new THREE.Mesh( 
            new THREE.PlaneGeometry( this.size.x, this.size.y ), 
            new THREE.MeshBasicMaterial({
                map: this.texture,
                transparent: true
            })
        );

        this.mesh.position.x = (this.pos.x+(this.size.x*0.5));
        this.mesh.position.y = -(this.pos.y+(this.size.y*0.5));
        this.mesh.position.z = 256+4;
        
        this.mesh.matrixAutoUpdate = false;
        this.mesh.updateMatrix();

        this.mesh._igEntity = this;

        // add the plane to the scene
        var self = this;
        setTimeout( function() { 
            self.texture.needsUpdate = true;
            ig.game.objects.push( self.mesh );
            ig.game.scene.add( self.mesh );
        }, 0 );
    },


    generateTexture: function() {

        // Create the back buffer to create the texture in
        var ox = 16;
        var oy = 16;

        var cvs = ig.$new( 'Canvas' );
            cvs.width = this.size.x;
            cvs.height = this.size.y;
        var ctx = cvs.getContext( '2d' );
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect( 0, 0, 48, 48 );

        // Draw node
        ctx.save();
        ctx.fillStyle = this.color[0];
        ctx.fillRect( ox, oy, 15, 15 );
        ctx.fillStyle = this.color[1];
        ctx.moveTo( ox, oy+15 );
        ctx.lineTo( ox+15, oy );
        ctx.lineTo( ox+15, oy+15 );
        ctx.fill();
        if( false ) {
            ctx.fillStyle = this.color[0];
            ctx.fillRect( ox, oy, 14, 1 );
            ctx.fillRect( ox+14, oy, 1, 14 );
            ctx.fillRect( ox+1, oy+14, 14, 1 );
            ctx.fillRect( ox, oy+1, 1, 14 );
        }
        ctx.restore();

        // For every thread
        var thread, slot, row, col, x, y, size, grid = [];
        grid.reset = function() { this.length = 0; while (this.length < 16) this.push(-1) };

        for( var i = 0; i < this.threads.length; i++ ) {
            grid.reset();
            thread = this._getThreadAtPos( i );

            // set x and y offset for thread positions
            if( i === 9 || i === 0 || i === 2 || i === 11 ) x = 0;
            if( i === 4 || i === 3 || i === 7 )             x = -16;
            if( i === 5 || i === 1 || i === 6 )             x = 16;
            if( i === 8 )   x = -32;
            if( i === 10 )  x = 32;

            if( i === 8 || i === 3 || i === 1 || i === 10 ) y = 0;
            if( i === 4 || i === 0 || i === 5 )             y = -16;
            if( i === 7 || i === 2 || i === 6 )             y = 16;
            if( i === 9 )   y = -32;
            if( i === 11 )  y = 32;

            x += ox;
            y += oy;


            // try and group data in a way that will be conductive to cluster formation (2x2, 4x4)
            var fillGrid = function( j, grid, type ) {
                var pos = 0;

                if( j <= 1 )              pos = j+12;
                if( j > 1  && j <= 3 )    pos = j+6;
                if( j > 3  && j <= 5 )    pos = j+10;
                if( j > 5  && j <= 7 )    pos = j+4;
                if( j > 7  && j <= 9 )    pos = j-4;
                if( j > 9  && j <= 11 )   pos = j-10;
                if( j > 11 && j <= 13 )   pos = j-6;
                if( j > 13 && j <= 15 )   pos = j-12;

                if( grid[pos] && grid[pos] === -1 ) {
                    grid[pos] = type;
                }
                else {
                    fillGrid( j+1, grid, type );
                }
            };

            // create the grid data for drawing/grouping data in clusters
            for( var j = 0; j < thread.data.p; j++ ) {
                fillGrid( j, grid, DataType.PRODUCTIVE );
            }
            for( var j = 0; j < thread.data.d; j++ ) {
                fillGrid( j, grid, DataType.DEFENSIVE );
            }
            for( var j = 0; j < thread.data.m; j++ ) {
                fillGrid( j, grid, DataType.MALICIOUS );
            }
            
            // draw the data to the buffer
            row = 0;
            for( var j = 0; j < grid.length; j++ ) {
                col = j % 4; // column

                // Choose color based on type
                if( grid[j] === -1 ) {
                    ctx.fillStyle = 'transparent';
                }
                if( grid[j] === 0 ) {
                    ctx.fillStyle = this.color[0];
                }
                if( grid[j] === 1 ) {
                    ctx.fillStyle = '#0e4';
                }
                if( grid[j] === 2 ) {
                    ctx.fillStyle = '#e20';
                }

                // 2x2 cluster
                size = 0;
                if( j % 8 === 0 || j % 8 === 2 ) {
                    // data adjacent is same type
                    if( grid[j+1] === grid[j] && grid[j+4] === grid[j] && grid[j+5] === grid[j] ) {
                        size = 1;
                    }
                }

                // Draw
                size = 3+(size+(size*3));
                ctx.save();
                if( i === 1 || i === 10 ) {
                    ctx.translate( 64+31, -16 );
                    ctx.rotate( (90).toRad() );
                    ctx.fillRect( x+(col*4), y+(row*4), size, size );
                }
                else if( i === 2 || i === 11 ) {
                    ctx.translate( 79, 111 );
                    ctx.rotate( (180).toRad() );
                    ctx.fillRect( x+(col*4), y+(row*4), size, size );
                }
                else if( i === 8 || i === 3 ) {
                    ctx.translate( -16, 63 );
                    ctx.rotate( (-90).toRad() );
                    ctx.fillRect( x+(col*4), y+(row*4), size, size );
                }
                else {
                    ctx.fillRect( x+(col*4), y+(row*4), size, size );
                }
                ctx.restore();

                if( col === 3 ) row++; // increment row every 4 squares
            }
        }

        this.imageData = cvs;
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
        if( team === Team.NONE )    this.color = Colors.LIGHT_GRAY;

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

        if( type === DataType.PRODUCTIVE ) {
            this._getThreadAtPos( pos ).data.p += amount;
        }
        if( type === DataType.DEFENSIVE ) {
            this._getThreadAtPos( pos ).data.d += amount;
        }
        if( type === DataType.MALICIOUS ) {
            this._getThreadAtPos( pos ).data.m += amount;
        }
    },


    setThreadData: function( pos, type, amount ) {
        amount = Math.round( amount );

        if( type === DataType.PRODUCTIVE ) {
            this._getThreadAtPos( pos ).data.p = amount;
        }
        if( type === DataType.DEFENSIVE ) {
            this._getThreadAtPos( pos ).data.d = amount;
        }
        if( type === DataType.MALICIOUS ) {
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


    click: function() {
        console.log( 'click' );
    },


    hover: function() {
        console.log( 'hover' );
    },

    
    update: function() {
        this.parent();

        var p, d, m;
        p = d = m = 0;
        for( var i = 0; i < this.threads.length; i++ ) {
            p += this.threads[i].data.p;
            d += this.threads[i].data.d;
            m += this.threads[i].data.m;
        }

        this.productionRate = p / 16;
        this.defense = this.baseDefense + d;
        this.attack = m;
    },


    draw: function() {
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