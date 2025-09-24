const { types } = require('../.commit-type.js');

const output = Object.entries(types).map(([type, config]) => ({
	type,
	description: config.description,
	emoji: config.emoji,
}));


console.log(JSON.stringify(output));