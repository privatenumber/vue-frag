import frag from '..';
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

test('Root frag', () => {
	const string = `Hello world ${Date.now()}`;
	const usage = {
		template: `<article v-frag>${string}</article>`,
		directives: {
			frag,
		},
	};

	const attachTo = document.createElement('div');
	document.body.append(attachTo);
	mount(usage, {attachTo});
	expect(document.body.innerHTML.trim()).toBe(string);
	attachTo.remove();
});

test('Reactive', async () => {
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
