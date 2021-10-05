import { ComponentOptions } from 'vue';

type FragmentComponent = ComponentOptions<never, never, never, never, never, never>;

declare const frag: {
	inserted(element: Element): void;
	unbind(element: Element): void;
	Fragment: FragmentComponent;
};

export = frag;
