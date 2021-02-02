import frag from 'vue-frag';
import {mount} from '@vue/test-utils';

test('Basic usage', () => {
	const string = `Hello world ${Date.now()}`;
	const TestComponent = {
		template: `<span v-frag>${string}</span>`,
		directives: {
			frag,
		},
	};

	const usage = {
		template: '<div><test-component /></div>',
		components: {
			TestComponent,
		},
	};

	const wrapper = mount(usage);
	expect(wrapper.html().trim()).toBe(`<div>${string}</div>`);
});

test('Frag on app root', () => {
	const string = `Hello world ${Date.now()}`;
	const usage = {
		template: `<article v-frag>${string}</article>`,
		directives: {
			frag,
		},
	};

	const attachTo = document.createElement('div');
	document.body.append(attachTo);
	const wrapper = mount(usage, {attachTo});
	expect(document.body.innerHTML.trim()).toBe(string);
	wrapper.destroy();
	attachTo.remove();
});

test('Nested frags', async () => {
	const ChildComp = {
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
			this.$options.components.ChildComp = ChildComp;
		},
	};

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

	const attachTo = document.createElement('div');
	document.body.append(attachTo);

	const wrapper = mount(usage, {attachTo});
	expect(document.body.innerHTML).toBe('Parent 5 4 3 2 1 0 <!---->');
	wrapper.destroy();
	attachTo.remove();
});

describe('Reactivity', () => {
	test('Data', async () => {
		const TestComponent = {
			template: `
				<span v-frag>Hello world {{ number }}</span>
			`,
			directives: {
				frag,
			},
			props: ['number'],
		};

		const usage = {
			template: `
				<article><test-component :number="number" /></article>
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
		wrapper.setData({number});
		await wrapper.vm.$nextTick();

		expect(wrapper.html()).toBe(`<article>Hello world ${number}</article>`);
	});

	test('v-if template', async () => {
		const TestComponent = {
			template: `
				<span v-frag>
					<template v-if="show">A</template>
				</span>
			`,
			directives: {
				frag,
			},
			props: ['show'],
		};

		const usage = {
			template: `
				<div class="wrapper">
					<test-component :show="show" />
				</div>
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

		const empty = '<div class="wrapper">\n  <!---->\n</div>';
		const ifTrue = '<div class="wrapper">A</div>';

		const wrapper = mount(usage);
		expect(wrapper.html()).toBe(empty);

		wrapper.setData({show: true});
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(ifTrue);

		wrapper.setData({show: false});
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(empty);

		wrapper.setData({show: true});
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(ifTrue);
	});

	test('v-if element', async () => {
		const TestComponent = {
			template: `
				<span v-frag>
					<div v-if="show">A</div>
				</span>
			`,
			directives: {
				frag,
			},
			props: ['show'],
		};

		const usage = {
			template: `
				<div class="wrapper">
					<test-component :show="show" />
				</div>
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

		const empty = '<div class="wrapper">\n  <!---->\n</div>';
		const ifTrue = '<div class="wrapper">\n  <div>A</div>\n</div>';

		const wrapper = mount(usage);
		expect(wrapper.html()).toBe(empty);

		wrapper.setData({show: true});
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(ifTrue);

		wrapper.setData({show: false});
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(empty);

		wrapper.setData({show: true});
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(ifTrue);
	});

	test('v-for template', async () => {
		const TestComponent = {
			template: '<span v-frag><template v-for="i in num">{{ i }}</template></span>',
			directives: {
				frag,
			},
			props: ['num'],
		};

		const usage = {
			template: '<div><test-component :num="num" /></div>',
			components: {
				TestComponent,
			},
			data() {
				return {
					num: 0,
				};
			},
		};

		const tpl = number => `<div>${number}</div>`;

		const wrapper = mount(usage);
		expect(wrapper.html()).toBe(tpl('\n  <!---->\n'));

		wrapper.setData({num: 1});
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(tpl('1'));

		wrapper.setData({num: 2});
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(tpl('12'));

		wrapper.setData({num: 3});
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(tpl('123'));
	});

	test('v-for element', async () => {
		const TestComponent = {
			template: `
				<span v-frag>
					<div v-for="i in num">{{ i }}</div>
				</span>
			`,
			directives: {
				frag,
			},
			props: ['num'],
		};

		const usage = {
			template: `
				<div>
					<test-component :num="num" />
				</div>
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

		const tpl = number => `<div>\n  ${number.map(n => `<div>${n}</div>`).join('\n  ')}\n</div>`;

		const wrapper = mount(usage);
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(tpl([1]));

		wrapper.setData({num: 2});
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(tpl([1, 2]));

		wrapper.setData({num: 3});
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(tpl([1, 2, 3]));
	});

	test('slot w/ v-if', async () => {
		const TestComponent = {
			template: `
				<span v-frag>
					<template v-if="show">{{ name }}</template>
					<slot />
				</span>
			`,
			directives: {
				frag,
			},
			props: ['name', 'show'],
		};

		const usage = {
			template: `
				<div class="wrapper">
					<test-component name="A" :show="show">
						<test-component name="B" :show="show" />
					</test-component>
				</div>
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

		const empty = '<div class="wrapper">\n  <!---->\n  <!---->\n</div>';
		const ifTrue = '<div class="wrapper">A B </div>';

		const wrapper = mount(usage);
		expect(wrapper.html()).toBe(empty);

		wrapper.setData({show: true});
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(ifTrue);

		wrapper.setData({show: false});
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(empty);

		wrapper.setData({show: true});
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(ifTrue);
	});

	test('slot w/ v-for', async () => {
		const TestComponent = {
			template: `
				<span v-frag>
					<div v-for="i in num">{{ name }} {{ i }}</div>
					<slot />
				</span>
			`,
			directives: {
				frag,
			},
			props: ['name', 'num'],
		};

		const usage = {
			template: `
				<div>
					<test-component name="A" :num="num">
						<test-component name="B" :num="num">
							<test-component name="C" :num="num" />
							</test-component>
						</test-component>
					</test-component>
				</div>
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

		const tpl = number => `<div>\n  ${number.map(n => `<div>${n}</div>`).join('\n  ')}\n</div>`;

		const wrapper = mount(usage);
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(tpl(['A 1', 'B 1', 'C 1']));

		wrapper.setData({num: 2});
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(tpl(['A 1', 'A 2', 'B 1', 'B 2', 'C 1', 'C 2']));

		wrapper.setData({num: 3});
		await wrapper.vm.$nextTick();
		expect(wrapper.html()).toBe(tpl(['A 1', 'A 2', 'A 3', 'B 1', 'B 2', 'B 3', 'C 1', 'C 2', 'C 3']));
	});
});

test('Parent v-if', async () => {
	const TestComponent = {
		template: '<span v-frag>Hello world</span>',
		directives: {
			frag,
		},
	};

	const usage = {
		template: `
			<article><test-component v-if="show" /></article>
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
	expect(wrapper.html()).toBe('<article>Hello world</article>');

	wrapper.setData({show: false});
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe('<article>\n  <!---->\n</article>');

	wrapper.setData({show: true});
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe('<article>Hello world</article>');
});

test('Parent multiple v-if', async () => {
	const TestComponent = {
		template: '<span v-frag><div>Hello world {{ name }}</div></span>',
		directives: {
			frag,
		},
		props: ['name'],
	};

	const usage = {
		template: `
			<article>
				<test-component name="A" key="a" v-if="show" />
				<test-component name="B" key="b" v-if="!show"/>
				<test-component name="C" key="c" v-if="show" />
			</article>
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
	expect(wrapper.html()).toBe('<article>\n  <div>Hello world A</div>\n  <!---->\n  <div>Hello world C</div>\n</article>');

	wrapper.setData({show: false});
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe('<article>\n  <!---->\n  <div>Hello world B</div>\n  <!---->\n</article>');

	wrapper.setData({show: true});
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe('<article>\n  <div>Hello world A</div>\n  <!---->\n  <div>Hello world C</div>\n</article>');
});

test('Parent nested v-if empty', async () => {
	const ChildComp = {
		template: '<article v-frag></article>',

		directives: {
			frag,
		},
	};

	const ParentComp = {
		template: '<section v-frag>Parent <child-comp v-if="shown" ref="child" /><div v-else>No Child</div></section>',

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
	const $parent = mount(ParentComp, {attachTo});

	expect(document.body.innerHTML).toBe('Parent <!---->');

	$parent.setData({shown: false});
	await $parent.vm.$nextTick();

	expect(document.body.innerHTML).toBe('Parent <div>No Child</div>');

	$parent.setData({shown: true});
	await $parent.vm.$nextTick();

	expect(document.body.innerHTML).toBe('Parent <!---->');

	$parent.destroy();
	attachTo.remove();

	expect(document.body.innerHTML).toBe('');
});

test('Parent nested v-if text', async () => {
	const ChildComp = {
		template: '<article v-frag>A</article>',

		directives: {
			frag,
		},
	};

	const ParentComp = {
		template: '<section v-frag><child-comp v-if="shown" /></section>',

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
	const wrapper = mount(ParentComp, {attachTo});

	expect(document.body.innerHTML).toBe('<!---->');

	wrapper.setData({shown: true});
	await wrapper.vm.$nextTick();

	expect(document.body.innerHTML).toBe('A');

	wrapper.setData({shown: false});
	await wrapper.vm.$nextTick();

	expect(document.body.innerHTML).toBe('<!---->');

	wrapper.setData({shown: true});
	await wrapper.vm.$nextTick();

	expect(document.body.innerHTML).toBe('A');

	wrapper.destroy();
	attachTo.remove();

	expect(document.body.innerHTML).toBe('');
});

test('Parent nested v-if', async () => {
	const ChildComp = {
		template: '<div v-frag><div v-if="shown">Child</div></div>',

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
		template: '<div v-frag>Parent <child-comp v-if="shown" ref="child" /></div>',

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

	const attachTo = document.createElement('div');
	document.body.append(attachTo);
	const $parent = mount(ParentComp, {attachTo});

	expect(document.body.innerHTML).toBe('Parent <div>Child</div>');

	const $child = $parent.findComponent({ref: 'child'});

	$parent.setData({shown: false});
	await $parent.vm.$nextTick();

	expect(document.body.innerHTML).toBe('Parent <!---->');

	$child.setData({shown: true});
	await $child.vm.$nextTick();

	expect(document.body.innerHTML).toBe('Parent <!---->');

	$parent.setData({shown: true});
	await $parent.vm.$nextTick();

	expect(document.body.innerHTML).toBe('Parent <div>Child</div>');

	$parent.destroy();

	expect(document.body.innerHTML).toBe('');
});

test('v-html', async () => {
	const TestComponent = {
		template: '<span v-frag v-html="code" />',
		directives: {
			frag,
		},
		props: ['num'],
		computed: {
			code() {
				return `<div>${this.num}</div><div>${this.num + 1}</div>`;
			},
		},
	};

	const usage = {
		template: '<article><test-component :num="num"/></article>',
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
	expect(wrapper.html()).toBe('<article>\n  <div>0</div>\n  <div>1</div>\n</article>');

	wrapper.setData({num: 1});
	await wrapper.vm.$nextTick();
	expect(wrapper.html()).toBe('<article>\n  <div>1</div>\n  <div>2</div>\n</article>');

	wrapper.setData({num: 2});
	await wrapper.vm.$nextTick();
	expect(wrapper.html()).toBe('<article>\n  <div>2</div>\n  <div>3</div>\n</article>');
});

// #17
test('child order change', async () => {
	const TestComponent = {
		template: '<div v-frag>{{ num }}</div>',
		directives: {
			frag,
		},
		props: ['num'],
	};

	const usage = {
		template: '<div><test-component v-for="i in numbers" :key="i" :num="i" /></div>',
		components: {
			TestComponent,
		},
		data() {
			return {
				numbers: [1, 2, 3],
			};
		},
		methods: {
			spliceAndReverse() {
				this.numbers.splice(1, 1);
				this.numbers.reverse();
			},
		},
	};

	const tpl = number => `<div>${number}</div>`;

	const wrapper = mount(usage);

	expect(wrapper.html()).toBe(tpl(123));

	wrapper.vm.spliceAndReverse();
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe(tpl(31));

	wrapper.vm.spliceAndReverse();
	await wrapper.vm.$nextTick();

	expect(wrapper.html()).toBe(tpl(3));
});

// #21
test('v-if slot', async () => {
	const TestComponent = {
		template: '<div v-frag><slot /></div>',
		directives: {
			frag,
		},
	};

	const usage = {
		template: `
			<div class="wrapper">
				<test-component><div v-if="show">A</div></test-component>
			</div>
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

	const empty = '<div class="wrapper">\n  <!---->\n</div>';
	const ifTrue = '<div class="wrapper">\n  <div>A</div>\n</div>';

	const wrapper = mount(usage);
	expect(wrapper.html()).toBe(empty);

	wrapper.setData({show: true});
	await wrapper.vm.$nextTick();
	expect(wrapper.html()).toBe(ifTrue);

	wrapper.setData({show: false});
	await wrapper.vm.$nextTick();
	expect(wrapper.html()).toBe(empty);

	wrapper.setData({show: true});
	await wrapper.vm.$nextTick();
	expect(wrapper.html()).toBe(ifTrue);
});
