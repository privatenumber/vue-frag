import type { ComponentOptions } from 'vue';
import type Vue from 'vue';

type FragmentComponent = ComponentOptions<Vue, never, never, never, never, never> & {
	name: 'Fragment';
};

declare const frag: {
	inserted(element: Element): void;
	unbind(element: Element): void;
	Fragment: FragmentComponent;
};

export = frag;
