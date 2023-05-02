import { describe, test, expect } from 'vitest';
import Vue, { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import outdent from 'outdent';
import frag from '../src/index.esm.js';
import {
	dualMount,
	createMountTarget,
} from './utils';

Vue.config.ignoredElements = ['app', 'frag'];

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
	const FragComponent = defineComponent({
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
		template: '<app><frag-component :num="num"/></app>',
		components: {
			FragComponent,
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

	await wrapper.setData({ num: 1 });
	expect(wrapper.html()).toBe(outdent`
	<app>
	  <child-a>1</child-a>
	  <child-b>2</child-b>
	</app>
	`);

	await wrapper.setData({ num: 2 });
	expect(wrapper.html()).toBe(outdent`
	<app>
	  <child-a>2</child-a>
	  <child-b>3</child-b>
	</app>
	`);
});

describe('Reactivity', () => {
	test('Data', async () => {
		const FragComponent = {
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
				<app><frag-component :number="number" /></app>
			`,
			components: {
				FragComponent,
			},
			data() {
				return {
					number: 0,
				};
			},
		};

		const wrapper = dualMount(usage);

		const number = Date.now();
		await wrapper.setData({ number });

		expect(wrapper.frag.html()).toBe(`<app>Hello world ${number}</app>`);
		wrapper.expectMatchingDom();
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

		const wrapper = dualMount(usage);
		expect(wrapper.frag.html()).toBe(empty);
		wrapper.expectMatchingDom();

		await wrapper.setData({ show: true });
		expect(wrapper.frag.html()).toBe(ifTrue);
		wrapper.expectMatchingDom();

		await wrapper.setData({ show: false });
		expect(wrapper.frag.html()).toBe(empty);
		wrapper.expectMatchingDom();

		await wrapper.setData({ show: true });
		expect(wrapper.frag.html()).toBe(ifTrue);
		wrapper.expectMatchingDom();
	});

	test('v-if element', async () => {
		const FragComponent = {
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
					<frag-component :show="show" />
				</app>
			`,
			components: {
				FragComponent,
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

		const wrapper = dualMount(usage);
		expect(wrapper.frag.html()).toBe(empty);
		wrapper.expectMatchingDom();

		await wrapper.setData({ show: true });
		expect(wrapper.frag.html()).toBe(ifTrue);
		wrapper.expectMatchingDom();

		await wrapper.setData({ show: false });
		expect(wrapper.frag.html()).toBe(empty);
		wrapper.expectMatchingDom();

		await wrapper.setData({ show: true });
		expect(wrapper.frag.html()).toBe(ifTrue);
		wrapper.expectMatchingDom();
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
		wrapper.expectMatchingDom();

		await wrapper.setData({ num: 1 });
		expect(wrapper.frag.html()).toBe(tpl('1'));

		await wrapper.setData({ num: 2 });
		expect(wrapper.frag.html()).toBe(tpl('12'));

		await wrapper.setData({ num: 3 });
		expect(wrapper.frag.html()).toBe(tpl('123'));
	});

	test('v-for element', async () => {
		const FragComponent = {
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
					<frag-component :num="num" />
				</app>
			`,
			components: {
				FragComponent,
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

		const wrapper = dualMount(usage);

		expect(wrapper.frag.html()).toBe(tpl([1]));
		wrapper.expectMatchingDom();

		await wrapper.setData({ num: 2 });
		expect(wrapper.frag.html()).toBe(tpl([1, 2]));
		wrapper.expectMatchingDom();

		await wrapper.setData({ num: 3 });
		expect(wrapper.frag.html()).toBe(tpl([1, 2, 3]));
		wrapper.expectMatchingDom();
	});

	test('slot w/ v-if', async () => {
		const FragComponent = {
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
					<frag-component name="A" :show="show">
						<frag-component name="B" :show="show" />
					</frag-component>
				</app>
			`,
			components: {
				FragComponent,
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

		const wrapper = dualMount(usage);
		expect(wrapper.frag.html()).toBe(empty);
		wrapper.expectMatchingDom();

		await wrapper.setData({ show: true });
		expect(wrapper.frag.html()).toBe(ifTrue);
		wrapper.expectMatchingDom();

		await wrapper.setData({ show: false });
		expect(wrapper.frag.html()).toBe(empty);
		wrapper.expectMatchingDom();

		await wrapper.setData({ show: true });
		expect(wrapper.frag.html()).toBe(ifTrue);
		wrapper.expectMatchingDom();
	});

	test('slot w/ v-for', async () => {
		const FragComponent = {
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
					<frag-component name="A" :num="num">
						<frag-component name="B" :num="num">
							<frag-component name="C" :num="num" />
							</frag-component>
						</frag-component>
					</frag-component>
				</app>
			`,
			components: {
				FragComponent,
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

		const wrapper = dualMount(usage);

		expect(wrapper.frag.html()).toBe(tpl(['A 1', 'B 1', 'C 1']));
		wrapper.expectMatchingDom();

		await wrapper.setData({ num: 2 });
		expect(wrapper.frag.html()).toBe(tpl(['A 1', 'A 2', 'B 1', 'B 2', 'C 1', 'C 2']));
		wrapper.expectMatchingDom();

		await wrapper.setData({ num: 3 });
		expect(wrapper.frag.html()).toBe(tpl(['A 1', 'A 2', 'A 3', 'B 1', 'B 2', 'B 3', 'C 1', 'C 2', 'C 3']));
		wrapper.expectMatchingDom();
	});
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

	const wrapper = dualMount(fragApp);

	expect(wrapper.frag.html()).toBe('<app>Hello world</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ show: false });
	expect(wrapper.frag.html()).toBe(outdent`
	<app>
	  <!---->
	</app>
	`);
	wrapper.expectMatchingDom();

	await wrapper.setData({ show: true });
	expect(wrapper.frag.html()).toBe('<app>Hello world</app>');
	wrapper.expectMatchingDom();
});

test('Parent multiple v-if', async () => {
	const FragComponent = {
		template: '<frag v-frag><div>Hello world {{ name }}</div></frag>',
		directives: {
			frag,
		},
		props: ['name'],
	};

	const usage = {
		template: `
			<app>
				<frag-component name="A" key="a" v-if="show" />
				<frag-component name="B" key="b" v-if="!show"/>
				<frag-component name="C" key="c" v-if="show" />
			</app>
		`,
		components: {
			FragComponent,
		},
		data() {
			return {
				show: true,
			};
		},
	};

	const wrapper = dualMount(usage);

	expect(wrapper.frag.html()).toBe(outdent`
	<app>
	  <div>Hello world A</div>
	  <!---->
	  <div>Hello world C</div>
	</app>
	`);

	await wrapper.setData({ show: false });

	expect(wrapper.frag.html()).toBe(outdent`
	<app>
	  <!---->
	  <div>Hello world B</div>
	  <!---->
	</app>
	`);

	await wrapper.setData({ show: true });

	expect(wrapper.frag.html()).toBe(outdent`
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

	await $parent.setData({ shown: false });

	expect(document.body.innerHTML).toBe('Parent <div>No Child</div>');

	await $parent.setData({ shown: true });

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

	await wrapper.setData({ shown: true });

	expect(document.body.innerHTML).toBe('A');

	await wrapper.setData({ shown: false });

	expect(document.body.innerHTML).toBe('<!---->');

	await wrapper.setData({ shown: true });

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
		attachTo: createMountTarget(),
	});

	expect(document.body.innerHTML).toBe('Parent <div>Child</div>');

	const $child = $parent.findComponent({ ref: 'child' });

	await $parent.setData({ shown: false });

	expect(document.body.innerHTML).toBe('Parent <!---->');

	// Updating destroyed child should have no lingering effects on parent
	await $child.setData({ shown: true });

	expect(document.body.innerHTML).toBe('Parent <!---->');

	await $parent.setData({ shown: true });

	expect(document.body.innerHTML).toBe('Parent <div>Child</div>');

	$parent.destroy();

	expect(document.body.innerHTML).toBe('');
});

// #17
test('child order change', async () => {
	const FragComponent = {
		template: '<frag v-frag>{{ num }}</frag>',
		directives: {
			frag,
		},
		props: ['num'],
	};

	const usage = {
		template: '<app><frag-component v-for="i in numbers" :key="i" :num="i" /></app>',
		components: {
			FragComponent,
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
	const FragComponent = {
		template: '<frag v-frag><slot /></frag>',
		directives: {
			frag,
		},
	};

	const usage = {
		template: `
			<app class="wrapper">
				<frag-component><div v-if="show">A</div></frag-component>
			</app>
		`,
		components: {
			FragComponent,
		},
		data() {
			return {
				show: false,
			};
		},
	};

	const empty = '<app class="wrapper">\n  <!---->\n</app>';
	const ifTrue = '<app class="wrapper">\n  <div>A</div>\n</app>';

	const wrapper = dualMount(usage);

	expect(wrapper.frag.html()).toBe(empty);
	wrapper.expectMatchingDom();

	await wrapper.setData({ show: true });
	expect(wrapper.frag.html()).toBe(ifTrue);
	wrapper.expectMatchingDom();

	await wrapper.setData({ show: false });
	expect(wrapper.frag.html()).toBe(empty);
	wrapper.expectMatchingDom();

	await wrapper.setData({ show: true });
	expect(wrapper.frag.html()).toBe(ifTrue);
	wrapper.expectMatchingDom();
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

	const wrapper = dualMount(usage);

	expect(wrapper.frag.html()).toBe('<app>Child<span></span></app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ isVisible: false });
	expect(wrapper.frag.html()).toBe('<app>\n  <!---->\n  <!---->\n</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ isVisible: true });
	expect(wrapper.frag.html()).toBe('<app>Child<span></span></app>');
	wrapper.expectMatchingDom();
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

	const wrapper = dualMount(usage);

	expect(wrapper.frag.html()).toBe('<app>\n  <!---->\n  <!---->\n</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ isVisible: true });
	expect(wrapper.frag.html()).toBe('<app>ChildChild</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ isVisible: false });
	expect(wrapper.frag.html()).toBe('<app>\n  <!---->\n  <!---->\n</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ isVisible: true });
	expect(wrapper.frag.html()).toBe('<app>ChildChild</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ isVisible: false });
	expect(wrapper.frag.html()).toBe('<app>\n  <!---->\n  <!---->\n</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ isVisible: true });
	expect(wrapper.frag.html()).toBe('<app>ChildChild</app>');
	wrapper.expectMatchingDom();
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

	const wrapper = dualMount(usage);

	expect(wrapper.frag.html()).toBe('<app><span></span>Child<span></span></app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ isVisible: false });
	expect(wrapper.frag.html()).toBe('<app>\n  <!---->\n  <!---->\n  <!---->\n</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ isVisible: true });
	expect(wrapper.frag.html()).toBe('<app><span></span>Child<span></span></app>');
	wrapper.expectMatchingDom();
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

	const wrapper = dualMount(usage);

	expect(wrapper.frag.html()).toBe('<app>\n  <!---->Child</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ isVisibleA: true });
	expect(wrapper.frag.html()).toBe('<app>ChildChild</app>');
	wrapper.expectMatchingDom();
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

	const wrapper = dualMount(usage);

	expect(wrapper.frag.html()).toBe('<app>ChildChild</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ isVisibleA: false });
	expect(wrapper.frag.html()).toBe('<app>\n  <!---->Child</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ isVisibleA: true });
	expect(wrapper.frag.html()).toBe('<app>ChildChild</app>');
	wrapper.expectMatchingDom();
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

	const wrapper = dualMount(usage);

	expect(wrapper.frag.html()).toBe('<app>ChildChild</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ isVisibleB: false });
	expect(wrapper.frag.html()).toBe('<app>Child\n  <!---->\n</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ isVisibleA: false });
	expect(wrapper.frag.html()).toBe('<app>\n  <!---->\n  <!---->\n</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ isVisibleA: true });
	expect(wrapper.frag.html()).toBe('<app>Child\n  <!---->\n</app>');
	wrapper.expectMatchingDom();
});

// #48
test('nested fragments', async () => {
	const Fragment = {
		directives: { frag },
		template: '<frag v-frag><slot /></frag>',
	};

	const usage = {
		template: `
		<app>
			<component :is="fragment">
				<Fragment>
					<div :key="id">{{ id }}</div>
				</Fragment>
			</component>
		</app>
		`,

		components: {
			Fragment,
			Fragment2: Fragment,
		},

		data() {
			return {
				id: 1,
				fragment: 'Fragment',
			};
		},
	};

	const wrapper = dualMount(usage);

	expect(wrapper.frag.html()).toBe(outdent`
	<app>
	  <div>1</div>
	</app>
	`);
	wrapper.expectMatchingDom();

	await wrapper.setData({ id: 2 });
	expect(wrapper.frag.html()).toBe(outdent`
	<app>
	  <div>2</div>
	</app>
	`);
	wrapper.expectMatchingDom();

	await wrapper.setData({ fragment: 'Fragment2' });
	expect(wrapper.frag.html()).toBe(outdent`
	<app>
	  <div>2</div>
	</app>
	`);
	wrapper.expectMatchingDom();
});

// #67
test('Set innerHTML of empty fragment', async () => {
	// The code below is not a common use-case.
	// It is written only for testing. Avoid direct DOM manipulation whenever possible.
	const usage = defineComponent({
		template: '<app><frag v-frag ref="fragment" /></app>',
		directives: { frag },
		data() {
			return {
				html: '',
			};
		},
		watch: {
			html() {
				(this.$refs.fragment as HTMLElement).innerHTML = this.html;
			},
		},
	});

	// @ts-expect-error @vue/test-utils has outdated types
	const wrapper = mount(usage);
	expect(wrapper.html()).toBe(
		outdent`
		<app>
		  <!---->
		</app>
		`,
	);

	const html = '<span>first</span><span>second</span>';
	const output = '<app><span>first</span><span>second</span></app>';

	await wrapper.setData({ html });
	expect(wrapper.html()).toBe(output);

	await wrapper.setData({ html: '' });
	expect(wrapper.html()).toBe(
		outdent`
		<app>
		  <!---->
		</app>
		`,
	);

	await wrapper.setData({ html });
	expect(wrapper.html()).toBe(output);
});

// #61
test('keep-alive - appendChild', async () => {
	const usage = {
		template: `
		<app>
			<frag v-frag>
				<keep-alive>
					<component :is="component"></component>
				</keep-alive>
			</frag>
		</app>
		`,
		directives: { frag },
		components: {
			A: { template: '<div>A</div>' },
			B: { template: '<div>B</div>' },
			C: { template: '<div>C</div>' },
		},
		data() {
			return {
				component: 'A',
			};
		},
	};

	const wrapper = dualMount(usage);
	expect(wrapper.frag.html()).toBe('<app>\n  <div>A</div>\n</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ component: 'B' });
	expect(wrapper.frag.html()).toBe('<app>\n  <div>B</div>\n</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ component: 'A' });
	expect(wrapper.frag.html()).toBe('<app>\n  <div>A</div>\n</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ component: 'C' });
	expect(wrapper.frag.html()).toBe('<app>\n  <div>C</div>\n</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ component: 'A' });
	expect(wrapper.frag.html()).toBe('<app>\n  <div>A</div>\n</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ component: '' });
	expect(wrapper.frag.html()).toBe('<app>\n  <!---->\n</app>');
	wrapper.expectMatchingDom();
});

// #61 2
test('keep-alive - insertBefore', async () => {
	const usage = {
		template: `
		<app>
			<frag v-frag>
				<keep-alive>
					<component :is="component"></component>
				</keep-alive>1
			</frag>
		</app>
		`,
		directives: { frag },
		components: {
			A: { template: '<div>A</div>' },
			B: { template: '<div>B</div>' },
			C: { template: '<div>C</div>' },
		},
		data() {
			return {
				component: 'A',
			};
		},
	};

	const wrapper = dualMount(usage);
	expect(wrapper.frag.html()).toBe('<app>\n  <div>A</div>1\n</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ component: 'B' });
	expect(wrapper.frag.html()).toBe('<app>\n  <div>B</div>1\n</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ component: 'A' });
	expect(wrapper.frag.html()).toBe('<app>\n  <div>A</div>1\n</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ component: 'C' });
	expect(wrapper.frag.html()).toBe('<app>\n  <div>C</div>1\n</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ component: 'A' });
	expect(wrapper.frag.html()).toBe('<app>\n  <div>A</div>1\n</app>');
	wrapper.expectMatchingDom();

	await wrapper.setData({ component: '' });
	expect(wrapper.frag.html()).toBe('<app>\n  <!---->1\n</app>');
	wrapper.expectMatchingDom();
});
