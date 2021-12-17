import frag from './frag.js';

export default {
	name: 'Fragment',
	directives: {
		frag,
	},
	render(h) {
		return h(
			'div',
			{
				directives: [
					{ name: 'frag' },
				],
			},
			this.$slots.default,
		);
	},
};
