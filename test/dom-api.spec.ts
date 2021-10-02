import Vue, { ComponentOptions } from 'vue';
import VueCommon from 'vue/dist/vue.common';
import { mount } from '@vue/test-utils';
import { defineComponent } from '@vue/composition-api';
import outdent from 'outdent';
import frag from '../src/frag';
import { serializeDOMTree, createMountTarget } from './utils';

Vue.config.ignoredElements = [/./];

type VueComponent = ComponentOptions<Vue>;
function createNonFragApp<Component extends VueComponent>(fragComponent: Component) {
	let components: VueComponent['components'] = undefined;

	if (fragComponent.components) {
		components = {
			...fragComponent.components,
		};

		for (const componentName in components) {
			components[componentName] = createNonFragApp(components[componentName] as Component);
		}
	}

	return {
		...fragComponent,
		template: fragComponent.template?.replace(/v-frag/g, ''),
		components,
	};
}


test('Basic usage', () => {
	const FragComponent = {
		template: `<frag v-frag>asdf</frag>`,
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

	const normalAppWrapper = mount(createNonFragApp(fragApp));
	const fragAppWrapper = mount(fragApp);

	expect(serializeDOMTree(fragAppWrapper.element)).toBe(
		serializeDOMTree(normalAppWrapper.element)
	);	

	expect(fragAppWrapper.html()).toBe(`<app>asdf</app>`);
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

	const normalAppWrapper = mount(createNonFragApp(fragApp));
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

	const normalAppWrapper = mount(createNonFragApp(fragApp));
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

	const normalAppWrapper = mount(createNonFragApp(fragApp));
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

test('Parent v-if', async () => {
	const FragComponent = {
		template: '<frag v-frag>Hello world</frag>',
		directives: {
			frag,
		},
	};

	const fragApp = {
		template: '<app><frag-component v-if="show" /></app>',
		components: {
			FragComponent,
		},
		data() {
			return {
				show: true,
			};
		},
	};

	const normalAppWrapper = mount(createNonFragApp(fragApp));
	const fragAppWrapper = mount(fragApp);

	expect(fragAppWrapper.html()).toBe('<app>Hello world</app>');

	expect(serializeDOMTree(fragAppWrapper.element)).toBe(
		serializeDOMTree(normalAppWrapper.element)
	);

	normalAppWrapper.setData({ show: false });
	await fragAppWrapper.setData({ show: false });
	expect(fragAppWrapper.html()).toBe(outdent`
	<app>
	  <!---->
	</app>
	`);

	expect(serializeDOMTree(fragAppWrapper.element)).toBe(
		serializeDOMTree(normalAppWrapper.element)
	);

	normalAppWrapper.setData({ show: true });
	await fragAppWrapper.setData({ show: true });
	expect(fragAppWrapper.html()).toBe('<app>Hello world</app>');

	expect(serializeDOMTree(fragAppWrapper.element)).toBe(
		serializeDOMTree(normalAppWrapper.element)
	);
});
