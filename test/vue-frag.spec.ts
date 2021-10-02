import Vue from 'vue';
import { mount } from '@vue/test-utils';
import frag from '../src/frag';
import { createMountTarget } from './utils';
import type { Component, ComponentOptions } from 'vue';
import { defineComponent } from '@vue/composition-api';
import outdent from 'outdent';

Vue.config.ignoredElements = ['app', 'frag'];

test('Basic usage', () => {
	const string = `Hello world ${Date.now()}`;
	const TestComponent = {
		template: `<frag v-frag>${string}</frag>`,
		directives: {
			frag,
		},
	};

	const usage = {
		template: '<app><test-component /></app>',
		components: {
			TestComponent,
		},
	};

	const wrapper = mount(usage);
	expect(wrapper.html().trim()).toBe(`<app>${string}</app>`);
});

test('Frag on app root', () => {
	const string = `Hello world ${Date.now()}`;
	const usage = {
		template: `<article v-frag>${string}</article>`,
		directives: {
			frag,
		},
	};

	const wrapper = mount(usage, {
		attachTo: createMountTarget(),
	});

	expect(document.body.innerHTML.trim()).toBe(string);

	wrapper.destroy();

	expect(document.body.innerHTML.trim()).toBe('');
});

test('Nested frags', async () => {
	const ChildComp = defineComponent({
		template: '<div v-frag>{{ depth }} <child-comp v-if="depth" :depth="depth - 1" /></div>',
		props: {
			depth: {
				type: Number,
				default: 5,
			},
		},
		directives: {
			frag,
		},
		beforeCreate() {
			this.$options.components!.ChildComp = ChildComp;
		},
	});

	const ParentComp = {
		template: '<div v-frag>Parent <child-comp /></div>',
		directives: {
			frag,
		},
		components: {
			ChildComp,
		},
	};

	const usage = {
		template: '<parent-comp />',
		components: {
			ParentComp,
		},
	};

	const wrapper = mount(usage, {
		attachTo: createMountTarget(),
	});
	expect(document.body.innerHTML).toBe('Parent 5 4 3 2 1 0 <!---->');
	wrapper.destroy();
});

test('v-html', async () => {
	const TestComponent = defineComponent({
		template: '<frag v-frag v-html="code" />',
		directives: {
			frag,
		},
		props: {
			num: {
				type: Number,
				required: true,
			},
		},
		computed: {
			code(): string {
				return `<child-a>${this.num}</child-a><child-b>${this.num + 1}</child-b>`;
			},
		},
	});

	const usage = {
		template: '<app><test-component :num="num"/></app>',
		components: {
			TestComponent,
		},
		data() {
			return {
				num: 0,
			};
		},
	};

	const wrapper = mount(usage);
	expect(wrapper.html()).toBe(outdent`
	<app>
	  <child-a>0</child-a>
	  <child-b>1</child-b>
	</app>
	`);

	wrapper.setData({ num: 1 });
	await wrapper.vm.$nextTick();
	expect(wrapper.html()).toBe(outdent`
	<app>
	  <child-a>1</child-a>
	  <child-b>2</child-b>
	</app>
	`);

	wrapper.setData({ num: 2 });
	await wrapper.vm.$nextTick();
	expect(wrapper.html()).toBe(outdent`
	<app>
	  <child-a>2</child-a>
	  <child-b>3</child-b>
	</app>
	`);
});

describe('Reactivity', () => {
	test('Data', async () => {
		const TestComponent = {
			template: `
				<frag v-frag>Hello world {{ number }}</frag>
			`,
			directives: {
				frag,
			},
			props: ['number'],
		};

		const usage = {
			template: `
				<app><test-component :number="number" /></app>
			`,
			components: {
				TestComponent,
			},
			data() {
				return {
					number: 0,
				};
			},
		};

		const wrapper = mount(usage);
		const number = Date.now();
		wrapper.setData({ number });
		await wrapper.vm.$nextTick();

		expect(wrapper.html()).toBe(`<app>Hello world ${number}</app>`);
	});

	test('v-if template', async () => {
		const usage = {
			template: `
				<app>
					<frag v-frag>
						<template v-if="show">A</template>
					</frag>
				</app>
			`,
			directives: {
				frag,
			},
			data() {
				return {
					show: false,
				};
			},
		};

		const empty = outdent`
		<app>
		  <!---->
		</app>
		`;

		const ifTrue = '<app>A</app>';

		const wrapper = mount(usage);
		expect(wrapper.html()).toBe(empty);

		wrapper.setData({ show: true });
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(ifTrue);

		wrapper.setData({ show: false });
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(empty);

		wrapper.setData({ show: true });
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(ifTrue);
	});

	test('v-if element', async () => {
		const TestComponent = {
			template: `
				<frag v-frag>
					<div v-if="show">A</div>
				</frag>
			`,
			directives: {
				frag,
			},
			props: ['show'],
		};

		const usage = {
			template: `
				<app class="wrapper">
					<test-component :show="show" />
				</app>
			`,
			components: {
				TestComponent,
			},
			data() {
				return {
					show: false,
				};
			},
		};

		const empty = outdent`
		<app class="wrapper">
		  <!---->
		</app>
		`;

		const ifTrue = outdent`
		<app class="wrapper">
		  <div>A</div>
		</app>
		`;

		const wrapper = mount(usage);
		expect(wrapper.html()).toBe(empty);

		wrapper.setData({ show: true });
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(ifTrue);

		wrapper.setData({ show: false });
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(empty);

		wrapper.setData({ show: true });
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(ifTrue);
	});

	test('v-for template', async () => {
		const TestComponent = {
			template: '<frag v-frag><template v-for="i in num">{{ i }}</template></frag>',
			directives: {
				frag,
			},
			props: ['num'],
		};

		const usage = {
			template: '<app><test-component :num="num" /></app>',
			components: {
				TestComponent,
			},
			data() {
				return {
					num: 0,
				};
			},
		};

		const tpl = (content: string) => `<app>${content}</app>`;

		const wrapper = mount(usage);
		expect(wrapper.html()).toBe(tpl('\n  <!---->\n'));

		wrapper.setData({ num: 1 });
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(tpl('1'));

		wrapper.setData({ num: 2 });
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(tpl('12'));

		wrapper.setData({ num: 3 });
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(tpl('123'));
	});

	test('v-for element', async () => {
		const TestComponent = {
			template: `
				<frag v-frag>
					<div v-for="i in num">{{ i }}</div>
				</frag>
			`,
			directives: {
				frag,
			},
			props: ['num'],
		};

		const usage = {
			template: `
				<app>
					<test-component :num="num" />
				</app>
			`,
			components: {
				TestComponent,
			},
			data() {
				return {
					num: 1,
				};
			},
		};

		const tpl = (children: number[]) => outdent`
		<app>
		  ${children.map(n => `<div>${n}</div>`).join('\n  ')}
		</app>
		`;

		const wrapper = mount(usage);
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(tpl([1]));

		wrapper.setData({ num: 2 });
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(tpl([1, 2]));

		wrapper.setData({ num: 3 });
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(tpl([1, 2, 3]));
	});

	test('slot w/ v-if', async () => {
		const TestComponent = {
			template: `
				<frag v-frag>
					<template v-if="show">{{ name }}</template>
					<slot />
				</frag>
			`,
			directives: {
				frag,
			},
			props: ['name', 'show'],
		};

		const usage = {
			template: `
				<app class="wrapper">
					<test-component name="A" :show="show">
						<test-component name="B" :show="show" />
					</test-component>
				</app>
			`,
			components: {
				TestComponent,
			},
			data() {
				return {
					show: false,
				};
			},
		};

		const empty = outdent`
		<app class="wrapper">
		  <!---->
		  <!---->
		</app>
		`;
		const ifTrue = '<app class="wrapper">A B </app>';

		const wrapper = mount(usage);
		expect(wrapper.html()).toBe(empty);

		wrapper.setData({ show: true });
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(ifTrue);

		wrapper.setData({ show: false });
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(empty);

		wrapper.setData({ show: true });
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(ifTrue);
	});

	test('slot w/ v-for', async () => {
		const TestComponent = {
			template: `
				<frag v-frag>
					<div v-for="i in num">{{ name }} {{ i }}</div>
					<slot />
				</frag>
			`,
			directives: {
				frag,
			},
			props: ['name', 'num'],
		};

		const usage = {
			template: `
				<app>
					<test-component name="A" :num="num">
						<test-component name="B" :num="num">
							<test-component name="C" :num="num" />
							</test-component>
						</test-component>
					</test-component>
				</app>
			`,
			components: {
				TestComponent,
			},
			data() {
				return {
					num: 1,
				};
			},
		};

		const tpl = (children: string[]) => outdent`
		<app>
		  ${children.map(n => `<div>${n}</div>`).join('\n  ')}
		</app>
		`;

		const wrapper = mount(usage);
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(tpl(['A 1', 'B 1', 'C 1']));

		wrapper.setData({ num: 2 });
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(tpl(['A 1', 'A 2', 'B 1', 'B 2', 'C 1', 'C 2']));

		wrapper.setData({ num: 3 });
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(tpl(['A 1', 'A 2', 'A 3', 'B 1', 'B 2', 'B 3', 'C 1', 'C 2', 'C 3']));
	});
});

test('Parent v-if', async () => {
	const TestComponent = {
		template: '<frag v-frag>Hello world</frag>',
		directives: {
			frag,
		},
	};

	const usage = {
		template: '<app><test-component v-if="show" /></app>',
		components: {
			TestComponent,
		},
		data() {
			return {
				show: true,
			};
		},
	};

	const wrapper = mount(usage);
	expect(wrapper.html()).toBe('<app>Hello world</app>');

	wrapper.setData({ show: false });
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe(outdent`
	<app>
	  <!---->
	</app>
	`);

	wrapper.setData({ show: true });
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe('<app>Hello world</app>');
});

test('Parent multiple v-if', async () => {
	const TestComponent = {
		template: '<frag v-frag><div>Hello world {{ name }}</div></frag>',
		directives: {
			frag,
		},
		props: ['name'],
	};

	const usage = {
		template: `
			<app>
				<test-component name="A" key="a" v-if="show" />
				<test-component name="B" key="b" v-if="!show"/>
				<test-component name="C" key="c" v-if="show" />
			</app>
		`,
		components: {
			TestComponent,
		},
		data() {
			return {
				show: true,
			};
		},
	};

	const wrapper = mount(usage);
	expect(wrapper.html()).toBe(outdent`
	<app>
	  <div>Hello world A</div>
	  <!---->
	  <div>Hello world C</div>
	</app>
	`);

	wrapper.setData({ show: false });
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe(outdent`
	<app>
	  <!---->
	  <div>Hello world B</div>
	  <!---->
	</app>
	`);

	wrapper.setData({ show: true });
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe(outdent`
	<app>
	  <div>Hello world A</div>
	  <!---->
	  <div>Hello world C</div>
	</app>
	`);
});

test('Parent nested v-if empty', async () => {
	const ChildComp = {
		template: '<frag v-frag></frag>',

		directives: {
			frag,
		},
	};

	const ParentComp = {
		template: '<frag v-frag>Parent <child-comp v-if="shown" ref="child" /><div v-else>No Child</div></frag>',

		directives: {
			frag,
		},

		components: {
			ChildComp,
		},

		data() {
			return {
				shown: true,
			};
		},
	};

	const attachTo = document.createElement('header');
	document.body.append(attachTo);
	const $parent = mount(ParentComp, { attachTo });

	expect(document.body.innerHTML).toBe('Parent <!---->');

	$parent.setData({ shown: false });
	await $parent.vm.$nextTick();

	expect(document.body.innerHTML).toBe('Parent <div>No Child</div>');

	$parent.setData({ shown: true });
	await $parent.vm.$nextTick();

	expect(document.body.innerHTML).toBe('Parent <!---->');

	$parent.destroy();
	attachTo.remove();

	expect(document.body.innerHTML).toBe('');
});

test('Parent nested v-if text', async () => {
	const ChildComp = {
		template: '<frag v-frag>A</frag>',

		directives: {
			frag,
		},
	};

	const ParentComp = {
		template: '<frag v-frag><child-comp v-if="shown" /></frag>',

		directives: {
			frag,
		},

		components: {
			ChildComp,
		},

		data() {
			return {
				shown: false,
			};
		},
	};

	const attachTo = document.createElement('header');
	document.body.append(attachTo);
	const wrapper = mount(ParentComp, { attachTo });

	expect(document.body.innerHTML).toBe('<!---->');

	wrapper.setData({ shown: true });
	await wrapper.vm.$nextTick();

	expect(document.body.innerHTML).toBe('A');

	wrapper.setData({ shown: false });
	await wrapper.vm.$nextTick();

	expect(document.body.innerHTML).toBe('<!---->');

	wrapper.setData({ shown: true });
	await wrapper.vm.$nextTick();

	expect(document.body.innerHTML).toBe('A');

	wrapper.destroy();
	attachTo.remove();

	expect(document.body.innerHTML).toBe('');
});

test('Parent nested v-if', async () => {
	const ChildComp = {
		template: '<frag v-frag><div v-if="shown">Child</div></frag>',

		directives: {
			frag,
		},

		data() {
			return {
				shown: true,
			};
		},
	};

	const ParentComp = {
		template: '<frag v-frag>Parent <child-comp v-if="shown" ref="child" /></frag>',

		directives: {
			frag,
		},

		components: {
			ChildComp,
		},

		data() {
			return {
				shown: true,
			};
		},
	};

	const $parent = mount(ParentComp, {
		attachTo: createMountTarget()
	});

	expect(document.body.innerHTML).toBe('Parent <div>Child</div>');

	const $child = $parent.findComponent({ ref: 'child' });

	$parent.setData({ shown: false });
	await $parent.vm.$nextTick();

	expect(document.body.innerHTML).toBe('Parent <!---->');

	// Updating destroyed child should have no lingering effects on parent
	$child.setData({ shown: true });
	await $child.vm.$nextTick();

	expect(document.body.innerHTML).toBe('Parent <!---->');

	$parent.setData({ shown: true });
	await $parent.vm.$nextTick();

	expect(document.body.innerHTML).toBe('Parent <div>Child</div>');

	$parent.destroy();

	expect(document.body.innerHTML).toBe('');
});

// #17
test('child order change', async () => {
	const TestComponent = {
		template: '<frag v-frag>{{ num }}</frag>',
		directives: {
			frag,
		},
		props: ['num'],
	};

	const usage = {
		template: '<app><test-component v-for="i in numbers" :key="i" :num="i" /></app>',
		components: {
			TestComponent,
		},
		data() {
			return {
				numbers: [1, 2, 3],
			};
		},
	};

	const spliceAndReverse = (vm: Vue & { numbers: number[] }) => {
		vm.numbers.splice(1, 1);
		vm.numbers.reverse();
	};

	const tpl = (content: number) => `<app>${content}</app>`;

	const wrapper = mount<Vue & {
		numbers: number[];
	}>(usage);

	expect(wrapper.html()).toBe(tpl(123));

	spliceAndReverse(wrapper.vm);
	await wrapper.vm.$nextTick();
	expect(wrapper.html()).toBe(tpl(31));

	spliceAndReverse(wrapper.vm);
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe(tpl(3));
});

// #21
test('v-if slot', async () => {
	const TestComponent = {
		template: '<frag v-frag><slot /></frag>',
		directives: {
			frag,
		},
	};

	const usage = {
		template: `
			<app class="wrapper">
				<test-component><div v-if="show">A</div></test-component>
			</app>
		`,
		components: {
			TestComponent,
		},
		data() {
			return {
				show: false,
			};
		},
	};

	const empty = '<app class="wrapper">\n  <!---->\n</app>';
	const ifTrue = '<app class="wrapper">\n  <div>A</div>\n</app>';

	const wrapper = mount(usage);
	expect(wrapper.html()).toBe(empty);

	wrapper.setData({ show: true });
	await wrapper.vm.$nextTick();
	expect(wrapper.html()).toBe(ifTrue);

	wrapper.setData({ show: false });
	await wrapper.vm.$nextTick();
	expect(wrapper.html()).toBe(empty);

	wrapper.setData({ show: true });
	await wrapper.vm.$nextTick();
	expect(wrapper.html()).toBe(ifTrue);
});

// #27
test('transition - swapping components', async () => {
	const ChildA = {
		template: '<frag v-frag>1a</frag>',
		directives: {
			frag,
		},
	};

	const ChildB = {
		template: '<div>1b</div>',
	};

	const usage = {
		template: `
			<app>
				<transition :css="false">
					<child-a v-if="showA" />
					<child-b v-else />
				</transition>
				2
			</app>
		`,
		components: {
			ChildA,
			ChildB,
		},
		data() {
			return {
				showA: true,
			};
		},
	};

	const wrapper = mount(usage, {
		stubs: {
			// Disable the default transition stub
			transition: false,
		},
	});

	expect(wrapper.html()).toBe('<app>1a\n  2\n</app>');

	await wrapper.setData({ showA: false });
	expect(wrapper.html()).toBe('<app>\n  <div>1b</div>\n  2\n</app>');
});

test('transition - frag to element', async () => {
	const usage = {
		data() {
			return {
				showA: true,
			};
		},
		template: `
		<app>
			<transition :css="false">
				<span v-if="showA" v-frag key="a">1a</span>
				<span v-else key="b">1b</span>
			</transition>
			2
		</app>
		`,
		directives: {
			frag,
		},
	};

	const wrapper = mount(usage, {
		stubs: {
			// Disable the default transition stub
			transition: false,
		},
	});

	expect(wrapper.html()).toBe('<app>1a\n  2\n</app>');

	await wrapper.setData({ showA: false });
	expect(wrapper.html()).toBe('<app><span>1b</span>\n  2\n</app>');
});

// #16
test('updating sibling node - update', async () => {
	const Child = {
		template: '<frag v-frag v-if="show">Child</frag>',
		props: ['show'],
		directives: {
			frag,
		},
	};

	const usage = {
		// Important that this is in one-line
		// When breaking into multiple lines, it inserts a textNode in between and breaks reproduction
		template: '<app><child :show="isVisible" /><span v-if="isVisible" /></app>',

		components: {
			Child,
		},

		data() {
			return {
				isVisible: true,
			};
		},
	};

	const wrapper = mount(usage);

	expect(wrapper.html()).toBe('<app>Child<span></span></app>');

	wrapper.setData({ isVisible: false });
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe('<app>\n  <!---->\n  <!---->\n</app>');

	wrapper.setData({ isVisible: true });
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe('<app>Child<span></span></app>');
});


// #16 2
test('updating sibling node - removal', async () => {
	const Child = {
		template: '<frag v-frag v-if="show">Child</frag>',
		props: ['show'],
		directives: {
			frag,
		},
	};

	const usage = {
		// Important that this is in one-line
		// When breaking into multiple lines, it inserts a textNode in between and breaks reproduction
		template: '<app><child :show="isVisible" /><child :show="isVisible" /></app>',

		components: {
			Child,
		},

		data() {
			return {
				isVisible: false,
			};
		},
	};

	const wrapper = mount(usage);

	expect(wrapper.html()).toBe('<app>\n  <!---->\n  <!---->\n</app>');

	wrapper.setData({ isVisible: true });
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe('<app>ChildChild</app>');

	wrapper.setData({ isVisible: false });
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe('<app>\n  <!---->\n  <!---->\n</app>');

	wrapper.setData({ isVisible: true });
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe('<app>ChildChild</app>');

	wrapper.setData({ isVisible: false });
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe('<app>\n  <!---->\n  <!---->\n</app>');

	wrapper.setData({ isVisible: true });
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe('<app>ChildChild</app>');
});

// #16 3
test('updating sibling node - removal - no nextSibling', async () => {
	const Child = {
		template: '<frag v-frag v-if="show">Child</frag>',
		props: ['show'],
		directives: {
			frag,
		},
	};

	const usage = {
		// Important that this is in one-line
		// When breaking into multiple lines, it inserts a textNode in between and breaks reproduction
		template: '<app><span v-if="isVisible" /><child :show="isVisible" /><span v-if="isVisible" /></app>',

		components: {
			Child,
		},

		data() {
			return {
				isVisible: true,
			};
		},
	};

	const wrapper = mount(usage);

	expect(wrapper.html()).toBe('<app><span></span>Child<span></span></app>');

	wrapper.setData({ isVisible: false });
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe('<app>\n  <!---->\n  <!---->\n  <!---->\n</app>');

	wrapper.setData({ isVisible: true });
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe('<app><span></span>Child<span></span></app>');
});

// #16 4
test('updating sibling node - insertion - previous non-frag sibling', async () => {
	const Child = {
		template: '<frag v-frag v-if="show">Child</frag>',
		props: ['show'],
		directives: {
			frag,
		},
	};

	const usage = {
		// Important that this is in one-line
		// When breaking into multiple lines, it inserts a textNode in between and breaks reproduction
		template: '<app><child :show="isVisibleA" /><child :show="isVisibleB" /></app>',

		components: {
			Child,
		},

		data() {
			return {
				isVisibleA: false,
				isVisibleB: true,
			};
		},
	};

	const wrapper = mount(usage);

	expect(wrapper.html()).toBe('<app>\n  <!---->Child</app>');

	wrapper.setData({ isVisibleA: true });
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe('<app>ChildChild</app>');
});

// #16 5
test('updating sibling node - insertion - placeholder before frag-child should be patched', async () => {
	const Child = {
		template: '<frag v-frag v-if="show">Child</frag>',
		props: ['show'],
		directives: {
			frag,
		},
	};

	const usage = {
		// Important that this is in one-line
		// When breaking into multiple lines, it inserts a textNode in between and breaks reproduction
		template: '<app><child :show="isVisibleA" /><child :show="isVisibleB" /></app>',

		components: {
			Child,
		},

		data() {
			return {
				isVisibleA: true,
				isVisibleB: true,
			};
		},
	};

	const wrapper = mount(usage);

	expect(wrapper.html()).toBe('<app>ChildChild</app>');

	wrapper.setData({ isVisibleA: false });
	await wrapper.vm.$nextTick();
	expect(wrapper.html()).toBe('<app>\n  <!---->Child</app>');

	wrapper.setData({ isVisibleA: true });
	await wrapper.vm.$nextTick();
	expect(wrapper.html()).toBe('<app>ChildChild</app>');
});

// #16 6
test('updating sibling node - insertion', async () => {
	const Child = {
		template: '<frag v-frag v-if="show">Child</frag>',
		props: ['show'],
		directives: {
			frag,
		},
	};

	const usage = {
		// Important that this is in one-line
		// When breaking into multiple lines, it inserts a textNode in between and breaks reproduction
		template: '<app><child :show="isVisibleA" /><child :show="isVisibleB" /></app>',

		components: {
			Child,
		},

		data() {
			return {
				isVisibleA: true,
				isVisibleB: true,
			};
		},
	};

	const wrapper = mount(usage);

	expect(wrapper.html()).toBe('<app>ChildChild</app>');

	wrapper.setData({ isVisibleB: false });
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe('<app>Child\n  <!---->\n</app>');

	wrapper.setData({ isVisibleA: false });
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe('<app>\n  <!---->\n  <!---->\n</app>');

	wrapper.setData({ isVisibleA: true });
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe('<app>Child\n  <!---->\n</app>');
});