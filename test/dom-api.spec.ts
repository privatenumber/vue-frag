import Vue from 'vue';
import { mount } from '@vue/test-utils';
import frag from '../src/frag';
import { serializeDOMTree, createMountTarget } from './utils';

Vue.config.ignoredElements = [/./];

test('Smallest tree', () => {
	const normalApp = {
		template: `
		<parent>
			<child />
		</parent>
		`,
	};

	const normalAppWrapper = mount(normalApp, {
		attachTo: createMountTarget(),
	});

	const expectedHTML = serializeDOMTree(document.body);

	normalAppWrapper.destroy();

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

	const fragAppWrapper = mount(fragApp, {
		attachTo: createMountTarget(),
	});

	expect(serializeDOMTree(document.body)).toBe(expectedHTML);

	expect(document.body.innerHTML).toBe('<child></child>');

	fragAppWrapper.destroy();
});

test('With root app', () => {
	const normalApp = {
		template: `
		<app>
			<parent>
				<child-a />
				<child-b />
			</parent>
		</app>
		`,
	};

	const normalAppWrapper = mount(normalApp);

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

	const fragAppWrapper = mount(fragApp);

	expect(serializeDOMTree(fragAppWrapper.element)).toBe(
		serializeDOMTree(normalAppWrapper.element)
	);

	expect(fragAppWrapper.html()).toBe('<app>\n  <child-a></child-a>\n  <child-b></child-b>\n</app>');
});

test('Deep nested tree', () => {
	const normalApp = {
		template: `
		<app>
			<parent-a>
				<parent-b>
					<parent-c>
						<child-d />
					</parent-c>
				</parent-b>
			</parent-a>
		</app>
		`,
	};

	const normalAppWrapper = mount(normalApp);

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

	const fragAppWrapper = mount(fragApp);

	expect(serializeDOMTree(fragAppWrapper.element)).toBe(
		serializeDOMTree(normalAppWrapper.element)
	);

	expect(fragAppWrapper.html()).toBe('<app>\n  <child-d></child-d>\n</app>');
});

test('horizontal tree', () => {
	const normalApp = {
		template: `
		<app>
			<parent-a>
				<child-a />
			</parent-a>
			<parent-b>
				<child-b />
			</parent-b>
			<parent-c>
				<child-c />
			</parent-c>
		</app>
		`.replace(/[\t\n]/g, ''),
	};

	const normalAppWrapper = mount(normalApp);

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

	const fragAppWrapper = mount(fragApp);

	expect(serializeDOMTree(fragAppWrapper.element)).toBe(
		serializeDOMTree(normalAppWrapper.element)
	);

	expect(fragAppWrapper.html()).toBe('<app>\n  <child-a></child-a>\n  <child-b></child-b>\n  <child-c></child-c>\n</app>');
});