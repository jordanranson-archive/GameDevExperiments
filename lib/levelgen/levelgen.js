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
		capEnds: true,
		genNodes: true,
		deadZones: true,
		deadZoneChance: 0.05,
		deadZoneRange: {
			a: 0.45,
			b: 0.55
		},
		nodePadding: 2,
		nodePaddingMin: 1,
		nodeStraitChance: 0.25,
		nodeCornerChance: 0.45,
		node3wayChance: 0.65,
		node4wayChance: 0.85
	},

	init: function( context ) {
		this.context = context;
	},

	generate: function( params ) {
		params = params ? params : this.params;

		var map = lg.Util.generateLevel( params );
		lg.Util.processLevel( map, params );
		lg.Util.drawLevel( map, this.context );
	}
});

lg.Branch = ig.Class.extend({
	x: 0,
	y: 0,
	direction: 1,
	pos: [],
	steps: 0,
	radius: 1,
	action: 'forward',
	lastAction: '',
	weights: [ 100, 100, 50 ],
	killCounter: 0,
	alive: true,
	aliveCounter: 0,
	map: [],
	branches: [],

	init: function( x, y, direction, map, branches ) {
		this.x = x;
		this.y = y;
		this.direction = direction;
		this.map = map;
		this.branches = branches;
	},

	swt: function( i ) { 
		return arguments[++i] 
	},

	update: function() {
		if( this.killCounter > 16 ) {
			this.alive = false;
		}

		// determine action
		if( this.steps <= 0 ) {

			// choose weights
			if( this.action === 'forward' && this.lastAction === 'forward' ) this.weights[0] = 50;
			else this.weights[0] = 100;

			if( this.aliveCounter < 2 ) this.weights[1] = 0;
			else if( this.action === 'turn' && this.lastAction === 'turn' ) this.weights[1] = 50;
			else this.weights[1] = 100;
			
			if( this.aliveCounter < 2 ) this.weights[2] = 0;
			else if( this.action === 'branch' && this.lastAction === 'branch' ) this.weights[2] = 50;
			else this.weights[2] = 100;

			// select action and number of steps
			this.action = this.swt( lg.Util.weightedRandom( 3, this.weights ), 'forward', 'turn', 'branch' );
			this.steps = 1;
		}

		// carry out action
		if( this.steps > 0 ) {

			// move forward
			if( this.action === 'forward' ) {
				var canMove;
				if( this.direction === 0 ) {
					canMove = lg.Util.check(this.map,this.x,this.y-1-this.radius);
					if( canMove ) this.y--;
				}
				if( this.direction === 1 ) {
					canMove = lg.Util.check(this.map,this.x+1+this.radius,this.y);
					if( canMove ) this.x++;
				}
				if( this.direction === 2 ) {
					canMove = lg.Util.check(this.map,this.x,this.y+1+this.radius);
					if( canMove ) this.y++;
				}
				if( this.direction === 3 ) {
					canMove = lg.Util.check(this.map,this.x-1-this.radius,this.y);
					if( canMove ) this.x--;
				}

				if( canMove ) {
					lg.Util.carve( this.map, this.x, this.y, this.radius );
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
						canTurn = lg.Util.check(this.map,this.x+1+this.radius,this.y);
						turnChance = 1;
					} 
					else if( turnChance === 1 ) { 
						canTurn = lg.Util.check(this.map,this.x-1-this.radius,this.y);
						turnChance = 3;
					}
					else {
						if( this.direction === 0 ) {
							canTurn = lg.Util.check(this.map,this.x,this.y+1+this.radius);
							turnChance = 2;
						}
					}
				}
				if( this.direction === 1 || this.direction === 3 ) {
					if( turnChance === 0 ) {
						canTurn = lg.Util.check(this.map,this.x,this.y+1+this.radius);
						turnChance = 2;
					} 
					else if( turnChance === 1 ) { 
						canTurn = lg.Util.check(this.map,this.x,this.y-1-this.radius);
						turnChance = 0;
					}
					else {
						if( this.direction === 3 ) {
							canTurn = lg.Util.check(this.map,this.x+1+this.radius,this.y);
							turnChance = 1;
						}
					}
				}

				// can do, turn!
				if( canTurn ) {
					this.direction = turnChance;

					this.action = 'forward';
					this.steps = this.radius+1;

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
					canBranch = lg.Util.check(this.map,this.x, this.y-1-this.radius);
				}
				if( d === 1 ) {
					canBranch = lg.Util.check(this.map,this.x+1+this.radius, this.y);
				}
				if( d === 2 ) {
					canBranch = lg.Util.check(this.map,this.x, this.y+1+this.radius);
				}
				if( d === 3 ) {
					canBranch = lg.Util.check(this.map,this.x-1-this.radius, this.y);
				}

				if( canBranch ) {
					this.branches.push( new lg.Branch( this.x, this.y, d, this.map, this.branches ) );
				}
				this.steps = 0;
			}
		}

		this.lastAction = this.action;
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

lg.Util.processLevel = function( grid, params ) {
	var newGrid = [];
	for( var y = 0; y < grid.length; y++ ) {
		newGrid[y] = [];
	}

	// create networks
	var tile, n, e, s, w;
	for( var y = 0; y < grid.length; y++ ) {
		for( var x = 0; x < grid[y].length; x++ ) {
			tile = grid[y][x];
			n = grid[y-1] ? grid[y-1][x] : -1;
			e = grid[y][x+1] ? grid[y][x+1] : -1;
			s = grid[y+1] ? grid[y+1][x] : -1;
			w = grid[y][x-1] ? grid[y][x-1] : -1;

			nodeChance = 0;
			if( tile === 'X' ) {
					 if( n !== 'X' && e === 'X' && s !== 'X' && w === 'X' ) { newGrid[y][x] = '0'; } // h
				else if( n !== 'X' && e === 'X' && s !== 'X' && w !== 'X' ) { newGrid[y][x] = params.capEnds?'M':'0'; } // h - cap
				else if( n !== 'X' && e !== 'X' && s !== 'X' && w === 'X' ) { newGrid[y][x] = params.capEnds?'M':'0'; } // h - cap
				else if( n === 'X' && e !== 'X' && s === 'X' && w !== 'X' ) { newGrid[y][x] = '1'; } // v
				else if( n === 'X' && e !== 'X' && s !== 'X' && w !== 'X' ) { newGrid[y][x] = params.capEnds?'M':'1'; } // v - cap
				else if( n !== 'X' && e !== 'X' && s === 'X' && w !== 'X' ) { newGrid[y][x] = params.capEnds?'M':'1'; } // v - cap
				else if( n === 'X' && e === 'X' && s !== 'X' && w !== 'X' ) { newGrid[y][x] = '2'; } // ne
				else if( n === 'X' && e !== 'X' && s !== 'X' && w === 'X' ) { newGrid[y][x] = '3'; } // nw
				else if( n !== 'X' && e === 'X' && s === 'X' && w !== 'X' ) { newGrid[y][x] = '4'; } // se
				else if( n !== 'X' && e !== 'X' && s === 'X' && w === 'X' ) { newGrid[y][x] = '5'; } // sw
				else if( n === 'X' && e === 'X' && s !== 'X' && w === 'X' ) { newGrid[y][x] = '6'; } // hn
				else if( n !== 'X' && e === 'X' && s === 'X' && w === 'X' ) { newGrid[y][x] = '7'; } // hs
				else if( n === 'X' && e === 'X' && s === 'X' && w !== 'X' ) { newGrid[y][x] = '8'; } // ve
				else if( n === 'X' && e !== 'X' && s === 'X' && w === 'X' ) { newGrid[y][x] = '9'; } // vw
				else if( e === 'X' && w === 'X' && n === 'X' && s === 'X' ) { newGrid[y][x] = '10'; } // i
				else newGrid[y][x] = tile;
			}
			else {
				newGrid[y][x] = tile;
			}
		}
	}

	var nodeChance, makeNode, radius;
	if( params.genNodes ) {
		for( var y = 0; y < grid.length; y++ ) {
			for( var x = 0; x < grid[y].length; x++ ) {
				tile = grid[y][x];
				n = grid[y-1] ? grid[y-1][x] : -1;
				e = grid[y][x+1] ? grid[y][x+1] : -1;
				s = grid[y+1] ? grid[y+1][x] : -1;
				w = grid[y][x-1] ? grid[y][x-1] : -1;

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
								if( newGrid[y+j] && newGrid[y+j][x+k] && newGrid[y+j][x+k] === 'N' ) makeNode = false;
								if( newGrid[y+j] && newGrid[y+j][x+k] && newGrid[y+j][x+k] === 'M' ) makeNode = false;
							}
						}
						
						// do it
						if( makeNode ) {
							newGrid[y][x] = 'N';
							lastNode = 0;
						}
					}
				}
			}
		}
	}

	return newGrid;
};

lg.Util.generateLevel = function( params ) {
	var grid = [];
	var branches = [];
	var process = true;

	/* 
		? - unexplored 
		. - explored

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

		N - empty node
	*/

	for( var y = 0; y < params.width; y++ ) { 
		grid[y] = [];
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
				grid[y][x] = '.';
				grid[y+1][x+1] = '.';
				grid[y-1][x-1] = '.';
				grid[y+1][x-1] = '.';
				grid[y-1][x+1] = '.';
			} 
			else if( grid[y][x] !== '.' ) {
				grid[y][x] = '?';
			}
		}
	}

	var sx = Math.round( Math.random() * (params.width*0.15) ) + Math.round( (params.width*0.05) );
	var sy = Math.round( Math.random() * (params.width*0.15) ) + Math.round( (params.width*0.05) );
	sx = sy = Math.round( params.width*0.5 );
	lg.Util.carve( grid, sx, sy, 1 );
	branches.push( new lg.Branch(sx, sy, 0, grid, branches ) );

	var branch;
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

	return grid;
};

lg.Util.check = function( grid, x, y ) {
	var width = grid.length;

	if( x < 0 ) return false;
	if( y < 0 ) return false;
	if( x > width ) return false;
	if( y > width ) return false;

	if( grid[y] && grid[y][x] && grid[y][x] === '?' ) return true;

	return false;
};

lg.Util.carve = function( grid, x, y, radius, value ) {
	value = value ? value : 'X';
	for( var j = -radius; j <= radius; j++ ) {
		for( var k = -radius; k <= radius; k++ ) {
			if( lg.Util.check(grid,x+k,y+j) ) grid[y+j][x+k] = '.';
		}
	}
	grid[y][x] = value;
};

lg.Util.drawLevel = function( grid, context ) {
	context.fillStyle = '#000';
	context.fillRect( 0, 0, 640, 640 );

	var tile;
	for( var y = 0; y < grid.length; y++ ) {
		for( var x = 0; x < grid[y].length; x++ ) {
			tile = grid[y][x];

			// draw explored area
			if( tile !== '?' ) {
				context.fillStyle = '#12171c';
				context.fillRect( x*16, y*16, 15, 15 );
			}

			// draw network
			context.fillStyle = '#525c6b';
			if( tile === 'X' ) {
				context.fillRect( x*16, y*16, 15, 15 );
			}
			if( tile === '0' ) {
				context.fillRect( x*16, y*16+5, 15, 5 );
			}
			if( tile === '1' ) {
				context.fillRect( x*16+5, y*16, 5, 15 );
			}
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
			if( tile === 'N' ) {
				context.fillStyle = '#0ff';
				context.fillRect( x*16, y*16, 15, 15 );
			}
			if( tile === 'M' ) {
				context.fillStyle = '#ff0';
				context.fillRect( x*16, y*16, 15, 15 );
			}

		}
	}
};

});