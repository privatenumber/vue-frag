import { expect } from 'vitest';
import { mount } from '@vue/test-utils';
import type { ComponentOptions } from 'vue';
import type Vue from 'vue';

const bfs = (rootNode: Node) => {
	const queue = [rootNode];
	const allNodes: Node[] = [];

	while (queue.length > 0) {
		const node = queue.shift()!;
		allNodes.push(node);

		queue.push(...Array.from(node.childNodes));
	}

	return allNodes;
};

type SerializedNode = {
	nodeName: string;
	parentNode?: SerializedNode | null;
	nextSibling?: SerializedNode | null;
	firstChild?: SerializedNode | null;
	// disabled because it evals to true when comment placeholder exists
	// hasChildNodes: boolean;
};

export const serializeNode = (
	node: Node | null,
	noReference?: boolean,
) => {
	if (!node) {
		return node;
	}

	// Ignore comment nodes, because v-frag uses a placeholder comment
	if (node.nodeName === '#comment') {
		return null;
	}

	const serialized: SerializedNode = {
		nodeName: node.nodeName,
	};

	if (!noReference) {
		serialized.parentNode = serializeNode(node.parentNode, true);
		serialized.nextSibling = serializeNode(node.nextSibling, true);
		serialized.firstChild = serializeNode(node.firstChild, true);
	}

	return serialized;
};

export const serializeDOMTree = (rootNode: Node) => JSON.stringify(
	bfs(rootNode).map(node => serializeNode(node)).filter(Boolean),
	null,
	'\t',
);

// Vue replaces this node, so there's no need for cleanup
export const createMountTarget = () => {
	const mountTarget = document.createElement('div');
	document.body.append(mountTarget);
	return mountTarget;
};

export const createNonFragApp = <V extends Vue>(fragComponent: ComponentOptions<V>) => {
	type Component = ComponentOptions<V>;
	let components: Component['components'];

	if (fragComponent.components) {
		components = {
			...fragComponent.components,
		};

		// eslint-disable-next-line guard-for-in
		for (const componentName in components) {
			components[componentName] = createNonFragApp(components[componentName] as Component);
		}
	}

	return {
		...fragComponent,
		template: fragComponent.template?.replaceAll(' v-frag', ''),
		components,
	};
};

export const dualMount = <V extends Vue>(component: ComponentOptions<V>) => {
	const normal = mount(createNonFragApp(component));
	const frag = mount(component);

	return {
		frag,
		normal,

		setData(data: object) {
			return Promise.all([
				normal.setData(data),
				frag.setData(data),
			]);
		},

		expectMatchingDom: () => {
			expect(serializeDOMTree(frag.element)).toBe(
				serializeDOMTree(normal.element),
			);
		},
	};
};
