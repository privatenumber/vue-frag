import Vue from 'vue';
import { mount } from '@vue/test-utils';
import outdent from 'outdent';
import frag from '../src/frag';
import {
	dualMount,
	createNonFragApp,
	serializeDOMTree,
	createMountTarget,
} from './utils';

Vue.config.ignoredElements = [/./];

test('Basic usage', () => {
	const FragComponent = {
		template: `<frag v-frag>hello</frag>`,
		directives: {
			frag,
		},
	};

	const fragApp = {
		template: '<app><frag-component /></app>',
		components: {
			FragComponent,
		},
	};

	const wrapper = dualMount(fragApp);

	wrapper.expectMatchingDom();
	expect(wrapper.frag.html()).toBe('<app>hello</app>');
});


test('Fragment on app root', () => {
	const fragApp = {
		template: `
		<parent v-frag>
			<child />
		</parent>
		`,
		directives: {
			frag,
		},
	};

	const normalAppWrapper = mount(createNonFragApp(fragApp), {
		attachTo: createMountTarget(),
	});

	const expectedHTML = serializeDOMTree(document.body);

	normalAppWrapper.destroy();

	const fragAppWrapper = mount(fragApp, {
		attachTo: createMountTarget(),
	});

	expect(serializeDOMTree(document.body)).toBe(expectedHTML);

	expect(document.body.innerHTML).toBe('<child></child>');

	fragAppWrapper.destroy();

	expect(document.body.innerHTML).toBe('');
});

test('With root app', () => {
	const fragApp = {
		template: `
		<app>
			<parent v-frag>
				<child-a />
				<child-b />
			</parent>
		</app>
		`,
		directives: {
			frag,
		},
	};

	const wrapper = dualMount(fragApp);

	wrapper.expectMatchingDom();
	expect(wrapper.frag.html()).toBe(outdent`
	<app>
	  <child-a></child-a>
	  <child-b></child-b>
	</app>
	`);
});

test('Deep nested tree', () => {
	const fragApp = {
		template: `
		<app>
			<parent-a v-frag>
				<parent-b v-frag>
					<parent-c v-frag>
						<child-d />
					</parent-c>
				</parent-b>
			</parent-a>
		</app>
		`,
		directives: {
			frag,
		},
	};

	const wrapper = dualMount(fragApp);

	wrapper.expectMatchingDom();
	expect(wrapper.frag.html()).toBe(outdent`
	<app>
	  <child-d></child-d>
	</app>
	`);
});

test('horizontal tree', () => {
	const fragApp = {
		template: `
		<app>
			<parent-a v-frag>
				<child-a />
			</parent-a>
			<parent-b v-frag>
				<child-b />
			</parent-b>
			<parent-c v-frag>
				<child-c />
			</parent-c>
		</app>
		`.replace(/[\t\n]/g, ''),
		directives: {
			frag,
		},
	};

	const wrapper = dualMount(fragApp);

	wrapper.expectMatchingDom();
	expect(wrapper.frag.html()).toBe(outdent`
	<app>
	  <child-a></child-a>
	  <child-b></child-b>
	  <child-c></child-c>
	</app>
	`);
});

test('v-for template', async () => {
	const FragComponent = {
		template: '<frag v-frag><template v-for="i in num">{{ i }}</template></frag>',
		directives: {
			frag,
		},
		props: ['num'],
	};

	const usage = {
		template: '<app><frag-component :num="num" /></app>',
		components: {
			FragComponent,
		},
		data() {
			return {
				num: 0,
			};
		},
	};

	const tpl = (content: string) => `<app>${content}</app>`;

	const wrapper = dualMount(usage);

	expect(wrapper.frag.html()).toBe(tpl('\n  <!---->\n'));
	// wrapper.expectMatchingDom();

	// await wrapper.setData({ num: 1 });
	// expect(wrapper.frag.html()).toBe(tpl('1'));

	// await wrapper.setData({ num: 2 });
	// expect(wrapper.frag.html()).toBe(tpl('12'));

	// await wrapper.setData({ num: 3 });
	// expect(wrapper.frag.html()).toBe(tpl('123'));
});

