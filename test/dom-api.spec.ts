import Vue from 'vue';
import { mount } from '@vue/test-utils';
import outdent from 'outdent';
import frag from '../src/frag';
import { serializeDOMTree, createMountTarget } from './utils';

Vue.config.ignoredElements = [/./];

function createNonFrag(fragComponent) {
	return {
		...fragComponent,
		template: fragComponent.template.replace(/v-frag/g, ''),
	};
}


test('Smallest tree', () => {
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

	const normalAppWrapper = mount(createNonFrag(fragApp), {
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

	const normalAppWrapper = mount(createNonFrag(fragApp));
	const fragAppWrapper = mount(fragApp);

	expect(serializeDOMTree(fragAppWrapper.element)).toBe(
		serializeDOMTree(normalAppWrapper.element)
	);

	expect(fragAppWrapper.html()).toBe(outdent`
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

	const normalAppWrapper = mount(createNonFrag(fragApp));
	const fragAppWrapper = mount(fragApp);

	expect(serializeDOMTree(fragAppWrapper.element)).toBe(
		serializeDOMTree(normalAppWrapper.element)
	);

	expect(fragAppWrapper.html()).toBe(outdent`
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

	const normalAppWrapper = mount(createNonFrag(fragApp));
	const fragAppWrapper = mount(fragApp);

	expect(serializeDOMTree(fragAppWrapper.element)).toBe(
		serializeDOMTree(normalAppWrapper.element)
	);

	expect(fragAppWrapper.html()).toBe(outdent`
	<app>
	  <child-a></child-a>
	  <child-b></child-b>
	  <child-c></child-c>
	</app>
	`);
});
