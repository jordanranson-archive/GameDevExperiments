ig.module(
	'game.enums'
)
.defines(function(){

Colors = {
	GRAY: [ '#656D78', '#434A54', '#222832', '#171c21' ],
	RED: [ '#ED5565 ', '#DA4453' ],
	ORANGE: [ '#FC6E51', '#E9573F' ],
	YELLOW: [ '#FFCE54', '#F6BB42' ],
	GREEN: [ '#A0D468', '#8CC152' ],
	TEAL: [ '#48CFAD', '#37BC9B' ],
	AQUA: [ '#4FC1E9', '#3BAFDA' ],
	BLUE: [ '#5D9CEC', '#4A89DC' ],
	PURPLE: [ '#AC92EC', '#967ADC' ],
	PINK: [ '#EC87C0', '#D770AD' ]
};


NodeSize = {
	SMALL: 4,
	MEDIUM: 8,
	LARGE: 12
};


NodeState = {
	VACANT: 0,
	PROCESSING: 1,
	CAPTURED: 2,
	DISABLED: 3
};


Team = {
	NONE: 0,
	RED: 1,
	ORANGE: 2,
	YELLOW: 3,
	GREEN: 4,
	TEAL: 5,
	AQUA: 6,
	BLUE: 7,
	PURPLE: 8,
	PINK: 9
};

ThreadProduction = {
	NONE: 0,
	DATA: 1,
	DEFENSE: 2,
	MALICE: 3
};

DataType = {
	PRODUCTIVE: 0,
	DEFENSIVE: 1,
	MALICIOUS: 2
};


});