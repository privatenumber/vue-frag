import Vue, { ComponentOptions } from 'vue';

type FragmentComponent<V extends Vue = Vue> = ComponentOptions<V, never, never, never, never, never>;

declare const frag: {
	inserted(element: Element): void;
	unbind(element: Element): void;
	Fragment: FragmentComponent;
};

export = frag;
