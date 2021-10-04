/**
 * @jest-environment node
 */

import { render } from '@vue/server-test-utils';
import frag from '..';

test('SSR', async () => {
	const wrapper = await render({
		template: '<div><div><span v-frag>Hello world</span></div></div>',
		directives: {
			frag,
		},
	});

	expect(wrapper.html()).toBe('<div><span>Hello world</span></div>');
});
