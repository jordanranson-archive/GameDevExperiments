var lg = {};
	lg.Util = {};

ig.module(
	'levelgen.levelgen'
)
.requires(
	'impact.game'
)
.defines(function(){

lg.Levelgen = ig.Class.extend({
	context: null,
	params: {
		width: 40,
		speed: 5,
		minSteps: 1,
		maxSteps: 1,

		forwardWeight: 100,
		forwardDiminishRate: 0.5,
		turnWeight: 50,
		turnDiminishRate: 0.5,
		branchWeight: 100,
		branchDiminishRate: 0.5,
		numCachedActions: 5,
		exploreRadius: 1,

		deadZones: false,
		deadZoneChance: 0.05,
		deadZoneRange: {
			a: 0.45,
			b: 0.55
		},

		capEnds: true,

		genNodes: true,
		nodePadding: 2,
		nodePaddingMin: 1,
		nodeStraitChance: 0.25,
		nodeCornerChance: 0.45,
		node3wayChance: 0.65,
		node4wayChance: 0.85
	},
	template: new ig.Image( 'media/templates/4square.png' ),

	init: function( context ) {
		if( context ) this.context = context;
	},

	generateLevel: function( params, template ) {
		params = params ? params : this.params;
		template = template ? lg.Util.processTemplate( this.template ) : undefined;

		var map = lg.Util.generateMap( params, template );
			map = lg.Util.processMap( map, params );

		return map;
	},

	drawLevel: function( params, template ) {
		params = params ? params : this.params;
		params.drawSteps = true;
		template = template ? lg.Util.processTemplate( this.template ) : undefined;
		lg.Util.generateMap( params, template, this.context );
	}
});

lg.Branch = ig.Class.extend({
	x: 0,
	y: 0,
	direction: 1,
	pos: [],
	steps: 0,
	action: 'forward',
	lastAction: [],
	weights: [ 0, 0, 0 ],
	killCounter: 0,
	alive: true,
	aliveCounter: 0,
	map: [],
	branches: [],

	init: function( x, y, direction, map, branches, params ) {
		this.x = x;
		this.y = y;
		this.direction = direction;
		this.map = map;
		this.branches = branches;
		this.params = params;
	},

	getCumulativeWeight: function( action, decay ) {
		var weight = 1;

		for( var i = this.lastAction.length; i > 0; --i ) {
			if( action === this.lastAction[i] ) {
				weight *= decay;
			} else {
				break;
			}
		}

		return weight;
	},

	update: function() {
		if( this.killCounter > 16 ) {
			this.alive = false;
		}

		// determine action
		if( this.steps <= 0 ) {

			// chance to move forward
			if( this.action === 'forward' && this.lastAction[this.lastAction.length-1] === 'forward' ) 
				this.weights[0] = this.params.forwardWeight * this.getCumulativeWeight( 'forward', this.params.forwardDiminishRate ) << 0;
			else this.weights[0] = this.params.forwardWeight;

			// chance to turn
			if( this.aliveCounter < 2 ) this.weights[1] = 0;
			else if( this.action === 'turn' && this.lastAction[this.lastAction.length-1] === 'turn' ) 
				this.weights[1] = this.params.turnWeight * this.getCumulativeWeight( 'turn', this.params.turnDiminishRate ) << 0;
			else this.weights[1] = this.params.turnWeight;

			// chance to branch
			if( this.aliveCounter < 2 ) this.weights[2] = 0;
			else if( this.action === 'branch' && this.lastAction[this.lastAction.length-1] === 'branch' ) 
				this.weights[2] = this.params.branchWeight * this.getCumulativeWeight( 'branch', this.params.branchDiminishRate ) << 0;
			else this.weights[2] = this.params.branchWeight;

			// select action and number of steps
			this.action = swt( lg.Util.weightedRandom( 3, this.weights ), 'forward', 'turn', 'branch' );
			this.steps = Math.max( 1, Math.round( Math.random() * (this.params.maxSteps - this.params.minSteps) + this.params.minSteps ) );
		}

		// carry out action
		if( this.steps > 0 ) {

			// move forward
			if( this.action === 'forward' ) {
				var canMove;
				if( this.direction === 0 ) {
					canMove = lg.Util.check(this.map,this.x,this.y-1-this.params.exploreRadius);
					if( canMove ) this.y--;
				}
				if( this.direction === 1 ) {
					canMove = lg.Util.check(this.map,this.x+1+this.params.exploreRadius,this.y);
					if( canMove ) this.x++;
				}
				if( this.direction === 2 ) {
					canMove = lg.Util.check(this.map,this.x,this.y+1+this.params.exploreRadius);
					if( canMove ) this.y++;
				}
				if( this.direction === 3 ) {
					canMove = lg.Util.check(this.map,this.x-1-this.params.exploreRadius,this.y);
					if( canMove ) this.x--;
				}

				if( canMove ) {
					lg.Util.carve( this.map, this.x, this.y, this.params.exploreRadius );
					this.steps--;
				}
				else {
					this.steps = 0;
				}
			}

			// turn
			if( this.action === 'turn' ) {

				// TODO: favor certain directions

				// check if can turn in a direction
				var canTurn = false;
				var turnChance = Math.random()*3<<0;

				// check if can turn that direction
				if( this.direction === 0 || this.direction === 2 ) {
					if( turnChance === 0 ) {
						canTurn = lg.Util.check(this.map,this.x+1+this.params.exploreRadius,this.y);
						turnChance = 1;
					} 
					else if( turnChance === 1 ) { 
						canTurn = lg.Util.check(this.map,this.x-1-this.params.exploreRadius,this.y);
						turnChance = 3;
					}
					else {
						if( this.direction === 0 ) {
							canTurn = lg.Util.check(this.map,this.x,this.y+1+this.params.exploreRadius);
							turnChance = 2;
						}
					}
				}
				if( this.direction === 1 || this.direction === 3 ) {
					if( turnChance === 0 ) {
						canTurn = lg.Util.check(this.map,this.x,this.y+1+this.params.exploreRadius);
						turnChance = 2;
					} 
					else if( turnChance === 1 ) { 
						canTurn = lg.Util.check(this.map,this.x,this.y-1-this.params.exploreRadius);
						turnChance = 0;
					}
					else {
						if( this.direction === 3 ) {
							canTurn = lg.Util.check(this.map,this.x+1+this.params.exploreRadius,this.y);
							turnChance = 1;
						}
					}
				}

				// can do, turn!
				if( canTurn ) {
					this.direction = turnChance;

					this.action = 'forward';
					this.steps = this.params.exploreRadius+1;

					this.killCounter = 0;
				} else {
					this.killCounter++;
				}
			}

			// branch off
			if( this.action === 'branch' ) {
				var canBranch, pos = [];

				// choose random direction other than current direction and the direction just came from
				var d = this.direction;
				while( d === this.direction && d !== this.direction+2 && d !== this.direction-2 ) d = Math.round( Math.random()*3 );

				// check if space is available
				if( d === 0 ) {
					canBranch = lg.Util.check(this.map,this.x, this.y-1-this.params.exploreRadius);
				}
				if( d === 1 ) {
					canBranch = lg.Util.check(this.map,this.x+1+this.params.exploreRadius, this.y);
				}
				if( d === 2 ) {
					canBranch = lg.Util.check(this.map,this.x, this.y+1+this.params.exploreRadius);
				}
				if( d === 3 ) {
					canBranch = lg.Util.check(this.map,this.x-1-this.params.exploreRadius, this.y);
				}

				if( canBranch ) {
					this.branches.push( new lg.Branch( this.x, this.y, d, this.map, this.branches, this.params ) );
				}
				this.steps = 0;
			}
		}

		this.lastAction.push( this.action );
		if( this.lastAction.length > this.params.numCachedActions ) this.lastAction.shift();

		this.aliveCounter++;
	}
});	

lg.Util.weightedRandom = function( choices, weight ) {
	var sum = 0;
	for(var i = 0; i < choices; i++ ) {
   		sum += weight[i];
	}

	var rnd = Math.random()*sum;
	for( var i = 0; i < choices; i++ ) {
		if( rnd < weight[i] ) return i;
		rnd -= weight[i];
	}

	return false;
};

lg.Util.processMap = function( map, params ) {
	var newMap = [];
	for( var y = 0; y < map.length; y++ ) {
		newMap[y] = [];
	}

	// create networks
	var tile, n, e, s, w;
	for( var y = 0; y < map.length; y++ ) {
		for( var x = 0; x < map[y].length; x++ ) {
			tile = map[y][x];
			n = map[y-1] ? map[y-1][x] : -1;
			e = map[y][x+1] ? map[y][x+1] : -1;
			s = map[y+1] ? map[y+1][x] : -1;
			w = map[y][x-1] ? map[y][x-1] : -1;

			if( tile === 'X' ) {
					 if( n !== 'X' && e === 'X' && s !== 'X' && w === 'X' ) { newMap[y][x] = '0'; } // h
				else if( n !== 'X' && e === 'X' && s !== 'X' && w !== 'X' ) { newMap[y][x] = params.capEnds?'N':'0'; } // h - cap
				else if( n !== 'X' && e !== 'X' && s !== 'X' && w === 'X' ) { newMap[y][x] = params.capEnds?'N':'0'; } // h - cap
				else if( n === 'X' && e !== 'X' && s === 'X' && w !== 'X' ) { newMap[y][x] = '1'; } // v
				else if( n === 'X' && e !== 'X' && s !== 'X' && w !== 'X' ) { newMap[y][x] = params.capEnds?'N':'1'; } // v - cap
				else if( n !== 'X' && e !== 'X' && s === 'X' && w !== 'X' ) { newMap[y][x] = params.capEnds?'N':'1'; } // v - cap
				else if( n === 'X' && e === 'X' && s !== 'X' && w !== 'X' ) { newMap[y][x] = '2'; } // ne
				else if( n === 'X' && e !== 'X' && s !== 'X' && w === 'X' ) { newMap[y][x] = '3'; } // nw
				else if( n !== 'X' && e === 'X' && s === 'X' && w !== 'X' ) { newMap[y][x] = '4'; } // se
				else if( n !== 'X' && e !== 'X' && s === 'X' && w === 'X' ) { newMap[y][x] = '5'; } // sw
				else if( n === 'X' && e === 'X' && s !== 'X' && w === 'X' ) { newMap[y][x] = '6'; } // hn
				else if( n !== 'X' && e === 'X' && s === 'X' && w === 'X' ) { newMap[y][x] = '7'; } // hs
				else if( n === 'X' && e === 'X' && s === 'X' && w !== 'X' ) { newMap[y][x] = '8'; } // ve
				else if( n === 'X' && e !== 'X' && s === 'X' && w === 'X' ) { newMap[y][x] = '9'; } // vw
				else if( e === 'X' && w === 'X' && n === 'X' && s === 'X' ) { newMap[y][x] = '10'; } // i
				else newMap[y][x] = tile;
			}
			else {
				newMap[y][x] = tile;
			}
		}
	}

	var nodeChance, makeNode, radius;
	if( params.genNodes ) {
		for( var y = 0; y < map.length; y++ ) {
			for( var x = 0; x < map[y].length; x++ ) {
				tile = map[y][x];
				n = map[y-1] ? map[y-1][x] : -1;
				e = map[y][x+1] ? map[y][x+1] : -1;
				s = map[y+1] ? map[y+1][x] : -1;
				w = map[y][x-1] ? map[y][x-1] : -1;

				nodeChance = 0;
				if( tile === 'X' ) {
						 if( n !== 'X' && e === 'X' && s !== 'X' && w === 'X' ) { nodeChance = params.nodeStraitChance; } // h
					else if( n === 'X' && e !== 'X' && s === 'X' && w !== 'X' ) { nodeChance = params.nodeStraitChance; } // v
					else if( n === 'X' && e === 'X' && s !== 'X' && w !== 'X' ) { nodeChance = params.nodeCornerChance; } // ne
					else if( n === 'X' && e !== 'X' && s !== 'X' && w === 'X' ) { nodeChance = params.nodeCornerChance; } // nw
					else if( n !== 'X' && e === 'X' && s === 'X' && w !== 'X' ) { nodeChance = params.nodeCornerChance; } // se
					else if( n !== 'X' && e !== 'X' && s === 'X' && w === 'X' ) { nodeChance = params.nodeCornerChance; } // sw
					else if( n === 'X' && e === 'X' && s !== 'X' && w === 'X' ) { nodeChance = params.node3wayChance; } // hn
					else if( n !== 'X' && e === 'X' && s === 'X' && w === 'X' ) { nodeChance = params.node3wayChance; } // hs
					else if( n === 'X' && e === 'X' && s === 'X' && w !== 'X' ) { nodeChance = params.node3wayChance; } // ve
					else if( n === 'X' && e !== 'X' && s === 'X' && w === 'X' ) { nodeChance = params.node3wayChance; } // vw
					else if( e === 'X' && w === 'X' && n === 'X' && s === 'X' ) { nodeChance = params.node4wayChance; } // i

					if( Math.random() >= 1-nodeChance ) {

						// look for surrounding nodes
						makeNode = true;
						radius = (Math.random()*params.nodePadding<<0) + params.nodePaddingMin;
						for( var j = -radius; j <= radius; j++ ) {
							for( var k = -radius; k <= radius; k++ ) {
								if( newMap[y+j] && newMap[y+j][x+k] && newMap[y+j][x+k] === 'N' ) makeNode = false;
							}
						}
						
						// do it
						if( makeNode ) {
							newMap[y][x] = 'N';
							lastNode = 0;
						}
					}
				}
			}
		}
	}

	for( var y = 0; y < newMap.length; y++ ) {
		for( var x = 0; x < newMap[y].length; x++ ) {
			if( newMap[y][x] === '?' ) {
				newMap[y][x] = '.';
			}
		}
	}

	return newMap;
};

lg.Util.generateMap = function( params, template, context ) {
	var map = [];
	var branches = [];

	/* 
		? - unexplored, color: #000
		. - explored, color: #333
		X - carved, color: #fff
		
		0 - horz
		1 - vert
		2 - ne
		3 - nw
		4 - se
		5 - sw
		6 - horz n
		7 - horz s
		8 - vert e
		9 - vert w
		10 - intersection

		N - empty nodes, color: #ccc
		A - player 1, color: #c00
		B - player 2, color: #0c0
		C - player 3, color: #00c
		D - player 4, color: #cc0
		E - player 5, color: #0cc
		F - player 6, color: #c0c

		! - branch spawn, color: #f0f
		!0 - spawn n, color: #f3f
		!1 - spawn w, color: #f6f
		!2 - spawn s, color: #f9f
		!3 - spawn w, color: #fcf
	*/

	for( var y = 0; y < params.width; y++ ) { 
		map[y] = [];
	}
	for( var y = 0; y < params.width; y++ ) {
		for( var x = 0; x < params.width; x++ ) {
			if( 
				params.deadZones &&
				Math.random() < params.deadZoneChance && 
				y > 2 && 
				x > 2 && 
				(y < params.width*params.deadZoneRange.a || y > params.width*params.deadZoneRange.b) && 
				(x < params.width*params.deadZoneRange.a || x > params.width*params.deadZoneRange.b) && 
				y < params.width-3 && 
				x < params.width-3 
			) {
				map[y][x] = '.';
				map[y+1][x+1] = '.';
				map[y-1][x-1] = '.';
				map[y+1][x-1] = '.';
				map[y-1][x+1] = '.';
			} 
			else if( map[y][x] !== '.' ) {
				map[y][x] = '?';
			}
		}
	}

	// Fill in with template if available
	if( template ) {
		var tile, direction;

		// Go over template and fill in map
		for( var y = 0; y < template.length; y++ ) {
			for( var x = 0; x < template[y].length; x++ ) {
				tile = template[y][x];
				if( tile !== '?' ) {
					map[y][x] = tile;
				}
			}
		}

		// Go over map and replace branch spawns with normal tiles
		// and spawn branches at their locations
		for( var y = 0; y < map.length; y++ ) {
			for( var x = 0; x < map[y].length; x++ ) {
				tile = map[y][x];
				direction = -1;

				// if string contains '!' spawn a branch
				if( !!~tile.indexOf('!') ) {

					// choose direction of branch
					for( var i = 0; i < 4; i++ ) {
						if( !!~tile.indexOf(i) ) {
							direction = i;
							break;
						}
					}

					direction = direction === -1 ? Math.random()*4<<0 : direction;
					lg.Util.carve( map, x, y, 1 );
					branches.push( new lg.Branch( x, y, direction, map, branches, params ) );
				}
			}
		}
	}

	// Otherwise just start a branch in the middle
	else {
		var start = Math.round( params.width*0.5 );
		lg.Util.carve( map, start, start, 1 );
		branches.push( new lg.Branch( start, start, Math.random()*4<<0, map, branches, params ) );
	}

	var branch;

	if( !params.drawSteps ) {
		while( branches.length > 0 ) {
			for( var k = 0; k < branches.length; k++ ) {
				branch = branches[k];
				branch.update();

				// remove from array if dead
				if( !branch.alive ) {
					branches.splice( branches.indexOf(branch), 1 );
				}
			}
		}

		return map;
	}

	else {
		var t = setInterval( function() {
			for( var k = 0; k < branches.length; k++ ) {
				branch = branches[k];
				branch.update();

				// remove from array if dead
				if( !branch.alive ) {
					branches.splice( branches.indexOf(branch), 1 );
				}
			}
			lg.Util.drawMap( map, context );

			if( branches.length <= 0 ) {
				clearInterval( t );
				map = lg.Util.processMap( map, params );
				lg.Util.drawMap( map, context );
				__map = map;
			}
		}, params.speed );
	}
};

lg.Util.processTemplate = function( image ) {
	var map = [];
	for( var i = 0; i < image.width; i++ ) {
		map[i] = [];
	}

	var cvs = ig.$new( 'Canvas' );
		cvs.width = cvs.height = image.width;

	var ctx = cvs.getContext( '2d' );
		ctx.drawImage( image.data, 0, 0, image.width, image.height );

	var imageData = ctx.getImageData( 0, 0, image.width, image.height );
	var data = imageData.data;

	var r,g,b;
	for (var y = 0; y < image.height; ++y) {
	    for (var x = 0; x < image.width; ++x) {
	        var index = (y * image.width + x) * 4;
	        r = data[index];      // red
	        g = data[++index];    // green
	        b = data[++index];    // blue

	        // map color to tile char
	        if( rgbToHex( r, g, b ) === '000000' ) map[y][x] = '?';
	        else if( rgbToHex( r, g, b ) === '333333' ) map[y][x] = '.';
	        else if( rgbToHex( r, g, b ) === 'ffffff' ) map[y][x] = 'X';

	        else if( rgbToHex( r, g, b ) === 'ff00ff' ) map[y][x] = '!';
	        else if( rgbToHex( r, g, b ) === 'ff33ff' ) map[y][x] = '!0';
	        else if( rgbToHex( r, g, b ) === 'ff66ff' ) map[y][x] = '!1';
	        else if( rgbToHex( r, g, b ) === 'ff99ff' ) map[y][x] = '!2';
	        else if( rgbToHex( r, g, b ) === 'ffccff' ) map[y][x] = '!3';

	        else map[y][x] = '?';
	    }
	}

	return map;
};

lg.Util.check = function( map, x, y, symbol ) {
	var width = map.length;

	if( x < 0 ) return false;
	if( y < 0 ) return false;
	if( x > width ) return false;
	if( y > width ) return false;

	if( map[y] && map[y][x] && map[y][x] === '?' ) return true;
	if( symbol && map[y] && map[y][x] && map[y][x] === symbol ) return true;

	return false;
};

lg.Util.carve = function( map, x, y, radius, value ) {
	value = value ? value : 'X';
	for( var j = -radius; j <= radius; j++ ) {
		for( var k = -radius; k <= radius; k++ ) {
			if( lg.Util.check(map,x+k,y+j) ) map[y+j][x+k] = '.';
		}
	}
	map[y][x] = value;
};

lg.Util.exportLevel = function( map ) {
	var canvas = ig.$new( 'Canvas' );
		canvas.width = canvas.height = 40;

	var context = canvas.getContext( '2d' );
		context.fillStyle = '#000';
		context.fillRect( 0, 0, 40, 40 );

	var tile;
	for( var y = 0; y < map.length; y++ ) {
		for( var x = 0; x < map[y].length; x++ ) {
			tile = map[y][x];

			// draw network
			context.fillStyle = '#333';
			if( tile === 'X' || !!~tile.search(/^\d+$/) ) context.fillRect( x, y, 1, 1 );

			// draw nodes
			context.fillStyle = '#ccc';
			if( tile === 'N' ) context.fillRect( x, y, 1, 1 );

			context.fillStyle = '#c00';
			if( tile === 'A' ) context.fillRect( x, y, 1, 1 );

			context.fillStyle = '#0c0';
			if( tile === 'B' ) context.fillRect( x, y, 1, 1 );

			context.fillStyle = '#00c';
			if( tile === 'C' ) context.fillRect( x, y, 1, 1 );

			context.fillStyle = '#cc0';
			if( tile === 'D' ) context.fillRect( x, y, 1, 1 );

			context.fillStyle = '#0cc';
			if( tile === 'E' ) context.fillRect( x, y, 1, 1 );

			context.fillStyle = '#c0c';
			if( tile === 'F' ) context.fillRect( x, y, 1, 1 );
		}
	}

	return canvas;
};

lg.Util.importLevel = function( image ) {
	var tileMap = [];
	var nodeMap = [];
	for( var i = 0; i < image.width; i++ ) {
		tileMap[i] = [];
		nodeMap[i] = [];
	}

	var cvs, ctx;
	if( image instanceof HTMLImageElement ) {
	    cvs = ig.$new( 'Canvas' );
		cvs.width = cvs.height = image.width;
		ctx = cvs.getContext( '2d' );
		ctx.drawImage( image, 0, 0, image.width, image.height );
	}
	else {
		cvs = image;
		ctx = cvs.getContext( '2d' );
	}

	var imageData = ctx.getImageData( 0, 0, image.width, image.height );
	var data = imageData.data;

	var getColor = function( data, x, y ) {
		var index = (y * image.width + x) * 4;

		if( data[index] && data[index+2] ) {
			var r = data[index];      // red
			var g = data[++index];    // green
			var b = data[++index];    // blue

			return rgbToHex2( [ r, g, b ] );
		}
		else {
			return '000000';
		}

    };

    var tile, n, e, s, w;
	for (var y = 0; y < image.height; ++y) {
	    for (var x = 0; x < image.width; ++x) {
	        tile = getColor( data, x, y );
			n = getColor( data, x,   y-1 );
			e = getColor( data, x+1, y );
			s = getColor( data, x,   y+1 );
			w = getColor( data, x-1, y );

			// tiles
			if( tile !== '000000' ) {
					 if( n === '000000' && e !== '000000' && s === '000000' && w !== '000000' ) { tileMap[y][x] = '0'; } // h
				else if( n === '000000' && e !== '000000' && s === '000000' && w === '000000' ) { tileMap[y][x] = '11'; } // h - cap
				else if( n === '000000' && e === '000000' && s === '000000' && w !== '000000' ) { tileMap[y][x] = '12'; } // h - cap
				else if( n !== '000000' && e === '000000' && s !== '000000' && w === '000000' ) { tileMap[y][x] = '1'; } // v
				else if( n !== '000000' && e === '000000' && s === '000000' && w === '000000' ) { tileMap[y][x] = '13'; } // v - cap
				else if( n === '000000' && e === '000000' && s !== '000000' && w === '000000' ) { tileMap[y][x] = '14'; } // v - cap
				else if( n !== '000000' && e !== '000000' && s === '000000' && w === '000000' ) { tileMap[y][x] = '2'; } // ne
				else if( n !== '000000' && e === '000000' && s === '000000' && w !== '000000' ) { tileMap[y][x] = '3'; } // nw
				else if( n === '000000' && e !== '000000' && s !== '000000' && w === '000000' ) { tileMap[y][x] = '4'; } // se
				else if( n === '000000' && e === '000000' && s !== '000000' && w !== '000000' ) { tileMap[y][x] = '5'; } // sw
				else if( n !== '000000' && e !== '000000' && s === '000000' && w !== '000000' ) { tileMap[y][x] = '6'; } // hn
				else if( n === '000000' && e !== '000000' && s !== '000000' && w !== '000000' ) { tileMap[y][x] = '7'; } // hs
				else if( n !== '000000' && e !== '000000' && s !== '000000' && w === '000000' ) { tileMap[y][x] = '8'; } // ve
				else if( n !== '000000' && e === '000000' && s !== '000000' && w !== '000000' ) { tileMap[y][x] = '9'; } // vw
				else if( e !== '000000' && w !== '000000' && n !== '000000' && s !== '000000' ) { tileMap[y][x] = '10'; } // i
				else tileMap[y][x] = '.';
			}
			else {
				tileMap[y][x] = '.';
			}

			// nodes
			if( tile === 'cccccc' ) nodeMap[y][x] = 'N';
			else if( tile === 'cc0000' ) nodeMap[y][x] = 'A';
			else if( tile === '00cc00' ) nodeMap[y][x] = 'B';
			else if( tile === '0000cc' ) nodeMap[y][x] = 'C';
			else if( tile === 'cccc00' ) nodeMap[y][x] = 'D';
			else if( tile === '00cccc' ) nodeMap[y][x] = 'E';
			else if( tile === 'cc00cc' ) nodeMap[y][x] = 'F';
			else nodeMap[y][x] = '.';
	    }
	}

	return { tileMap: tileMap, nodeMap: nodeMap };
};

lg.Util.drawMap = function( map, context ) {
	context.fillStyle = '#000';
	context.fillRect( 0, 0, 640, 640 );

	var tile;
	for( var y = 0; y < map.length; y++ ) {
		for( var x = 0; x < map[y].length; x++ ) {
			tile = map[y][x];

			// draw explored area
			if( tile !== '?' ) {
				context.fillStyle = '#12171c';
				context.fillRect( x*16, y*16, 15, 15 );
			}

			// draw network
			context.fillStyle = '#525c6b';
			if( tile === 'X' ) context.fillRect( x*16, y*16, 15, 15 );
			if( tile === '0' ) context.fillRect( x*16, y*16+5, 15, 5 );
			if( tile === '1' ) context.fillRect( x*16+5, y*16, 5, 15 );
			if( tile === '2' ) {
				context.fillRect( x*16+5, y*16+5, 10, 5 );
				context.fillRect( x*16+5, y*16, 5, 10 );
			}
			if( tile === '3' ) {
				context.fillRect( x*16, y*16+5, 10, 5 );
				context.fillRect( x*16+5, y*16, 5, 10 );
			}
			if( tile === '4' ) {
				context.fillRect( x*16+5, y*16+5, 10, 5 );
				context.fillRect( x*16+5, y*16+5, 5, 10 );
			}
			if( tile === '5' ) {
				context.fillRect( x*16, y*16+5, 10, 5 );
				context.fillRect( x*16+5, y*16+5, 5, 10 );
			}
			if( tile === '6' ) {
				context.fillRect( x*16, y*16+5, 15, 5 );
				context.fillRect( x*16+5, y*16, 5, 10 );
			}
			if( tile === '7' ) {
				context.fillRect( x*16, y*16+5, 15, 5 );
				context.fillRect( x*16+5, y*16+5, 5, 10 );
			}
			if( tile === '8' ) {
				context.fillRect( x*16+5, y*16+5, 10, 5 );
				context.fillRect( x*16+5, y*16, 5, 15 );
			}
			if( tile === '9' ) {
				context.fillRect( x*16, y*16+5, 10, 5 );
				context.fillRect( x*16+5, y*16, 5, 15 );
			}
			if( tile === '10' ) {
				context.fillRect( x*16, y*16+5, 15, 5 );
				context.fillRect( x*16+5, y*16, 5, 15 );
			}

			// draw nodes
			context.fillStyle = '#0ff';
			if( tile === 'N' ) context.fillRect( x*16, y*16, 15, 15 );
		}
	}
};

lg.Util.drawTilemap = function( map ) {
	var canvas = ig.$new( 'Canvas' );
	canvas.width = canvas.height = 1920;

	var context = canvas.getContext( '2d' );
	context.fillStyle = '#000';
	context.fillRect( 0, 0, 1920, 1920 );

	var tile;
	for( var y = 0; y < map.length; y++ ) {
		for( var x = 0; x < map[y].length; x++ ) {
			tile = map[y][x];

			// draw explored area
			if( tile !== '?' ) {
				context.fillStyle = '#12171c';
				context.fillRect( x*48, y*48, 48, 48 );
			}

			// draw network
			context.fillStyle = '#525c6b';
			if( tile === 'X' ) context.fillRect( x*48, y*48, 48, 48 );
			if( tile === '0' ) context.fillRect( x*48, y*48+21, 48, 5 );
			if( tile === '11' ) {
				context.fillRect( x*48+21, y*48+21, 48-21, 5 );
			}
			if( tile === '12' ) {
				context.fillRect( x*48, y*48+21, 48-21, 5 );
			}
			if( tile === '1' ) context.fillRect( x*48+21, y*48, 5, 48 );
			if( tile === '13' ) {
				context.fillRect( x*48+21, y*48, 5, 48-21 );
			}
			if( tile === '14' ) {
				context.fillRect( x*48+21, y*48+21, 5, 48-21 );
			}
			if( tile === '2' ) {
				context.fillRect( x*48+21, y*48+21, 27, 5 );
				context.fillRect( x*48+21, y*48, 5, 26 );
			}
			if( tile === '3' ) {
				context.fillRect( x*48, y*48+21, 26, 5 );
				context.fillRect( x*48+21, y*48, 5, 26 );
			}
			if( tile === '4' ) {
				context.fillRect( x*48+21, y*48+21, 27, 5 );
				context.fillRect( x*48+21, y*48+21, 5, 27 );
			}
			if( tile === '5' ) {
				context.fillRect( x*48, y*48+21, 26, 5 );
				context.fillRect( x*48+21, y*48+21, 5, 27 );
			}
			if( tile === '6' ) {
				context.fillRect( x*48, y*48+21, 48, 5 );
				context.fillRect( x*48+21, y*48, 5, 26 );
			}
			if( tile === '7' ) {
				context.fillRect( x*48, y*48+21, 48, 5 );
				context.fillRect( x*48+21, y*48+21, 5, 27 );
			}
			if( tile === '8' ) {
				context.fillRect( x*48+21, y*48+21, 27, 5 );
				context.fillRect( x*48+21, y*48, 5, 48 );
			}
			if( tile === '9' ) {
				context.fillRect( x*48, y*48+21, 26, 5 );
				context.fillRect( x*48+21, y*48, 5, 48 );
			}
			if( tile === '10' ) {
				context.fillRect( x*48, y*48+21, 48, 5 );
				context.fillRect( x*48+21, y*48, 5, 48 );
			}

			// draw nodes
			context.fillStyle = '#0ff';
			if( tile === 'N' ) context.fillRect( x*48, y*48, 48, 48 );
		}
	}

	var tempCvs, tempCtx, chunks = [];
    for( var y = 0; y < Math.ceil( canvas.height/128 ); y++ ) {
        chunks[y] = [];
        for( var x = 0; x < Math.ceil( canvas.width/128 ); x++ ) {
            tempCvs = ig.$new( 'Canvas' );
            tempCvs.width = tempCvs.height = 128;
            tempCtx = tempCvs.getContext( '2d' );
            tempCtx.drawImage( canvas, x*128, y*128, 128, 128, 0, 0, 128, 128 );
            chunks[y][x] = tempCvs;
        }
    }

    return chunks;
};

lg.Util.resize = function( data, scale ) {
	var origPixels = ig.getImagePixels( data, 0, 0, data.width, data.height );
	
	var widthScaled = data.width * scale;
	var heightScaled = data.height * scale;

	var scaled = ig.$new('canvas');
	scaled.width = widthScaled;
	scaled.height = heightScaled;
	var scaledCtx = scaled.getContext('2d');
	var scaledPixels = scaledCtx.getImageData( 0, 0, widthScaled, heightScaled );
		
	for( var y = 0; y < heightScaled; y++ ) {
		for( var x = 0; x < widthScaled; x++ ) {
			var index = (Math.floor(y / scale) * data.width + Math.floor(x / scale)) * 4;
			var indexScaled = (y * widthScaled + x) * 4;
			scaledPixels.data[ indexScaled ] = origPixels.data[ index ];
			scaledPixels.data[ indexScaled+1 ] = origPixels.data[ index+1 ];
			scaledPixels.data[ indexScaled+2 ] = origPixels.data[ index+2 ];
			scaledPixels.data[ indexScaled+3 ] = origPixels.data[ index+3 ];
		}
	}
	scaledCtx.putImageData( scaledPixels, 0, 0 );
	
	return scaled;
};

lg.Loader = ig.Loader.extend({
	end: function() {
		if( this.done ) { return; }
		
		clearInterval( this._intervalId );
		this.done = true;
		ig.system.clear( '#000' );
		ig.game = new (this.gameClass)();
	},
	
	loadResource: function( res ) {
		if( res instanceof ig.Sound ) {
			this._unloaded.erase( res.path );
		}
		else {
			this.parent( res );
		}
	}
});

function swt( i ) { 
	return arguments[++i];
}

function componentToHex( c ) {
    var hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}

function rgbToHex( r, g, b ) {
    return String( componentToHex(r) + componentToHex(g) + componentToHex(b) ).toLowerCase();
}

function rgbToHex2( arr ) {
    return String( componentToHex(arr[0]) + componentToHex(arr[1]) + componentToHex(arr[2]) ).toLowerCase();
}

});