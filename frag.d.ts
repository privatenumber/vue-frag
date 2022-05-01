import Vue, { ComponentOptions } from 'vue';

type FragmentComponent<V extends Vue = Vue> = ComponentOptions<V, never, never, never, never, never>;

declare const fragment: FragmentComponent

declare const frag: {
	inserted(element: Element): void;
	unbind(element: Element): void;
};

export {
	fragment as Fragment,
	frag as default
}
