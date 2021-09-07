import Vue from 'vue/dist/vue.common.js';
import frag from '../dist/frag.js';

Vue.config.ignoredElements = ['root', 'some-sibling', 'fragged'];

// #16
/**
 * Couldn't use vue-test-utils for this because VTU seems to require a custom
 * render function, and writing one manually bypasses the internals of the framework
 */
test('transition - swapping components', async () => {
	const Child = {
		template: '<fragged v-frag v-if="show">Child</fragged>',
		props: ['show'],
		directives: {
			frag,
		},
	};

	const app = new Vue({
		render(h) {
			/**
			 * This bug was only happening when the template was precompiled.
			 * With the runtime-compiler, it wasn't reproducible, because it inserts a textNode in between
			 */
			return h(
				'root',
				[
					h(
						Child,
						{
							props: {
								show: this.isVisible,
							},
						},
					),
					this.isVisible ? h('some-sibling') : this._e(),
				],
			);
		},

		data() {
			return {
				isVisible: true,
			};
		},
	});

	document.body.innerHTML = '<div id="app"></div>';
	app.$mount('#app');

	expect(document.body.innerHTML).toBe('<root>Child<some-sibling></some-sibling></root>');

	app.isVisible = false;

	await app.$nextTick();
	expect(document.body.innerHTML).toBe('<root><!----><!----></root>');

	app.isVisible = true;

	await app.$nextTick();
	expect(document.body.innerHTML).toBe('<root>Child<some-sibling></some-sibling></root>');

	// Another one to be sure

	app.isVisible = false;

	await app.$nextTick();
	expect(document.body.innerHTML).toBe('<root><!----><!----></root>');

	app.isVisible = true;

	await app.$nextTick();
	expect(document.body.innerHTML).toBe('<root>Child<some-sibling></some-sibling></root>');
});
