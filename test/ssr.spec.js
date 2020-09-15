/**
 * @jest-environment node
 */

import frag from 'vue-frag';
import {render} from '@vue/server-test-utils';

test('SSR', async () => {
	const wrapper = await render({
		template: '<div><div><span v-frag>Hello world</span></div></div>',
		directives: {
			frag,
		},
	});

	expect(wrapper.html()).toBe('<div><span>Hello world</span></div>');
});
