const $fakeParent = Symbol();
const nextSiblingPatched = Symbol();
const parentNodePatched = Symbol();
const childNodesPatched = Symbol();
const $placeholder = Symbol();

type FragmentElement<T extends Node = Node> = T & {
	frag: Node[];
	[$placeholder]: Comment;
}

type NodeWithFakeParent<T extends Node> = T & {
	[$fakeParent]: Node;
	[parentNodePatched]?: true;
}

type NodeWithFakeSibling<T extends Node> = T & {
	[nextSiblingPatched]?: true;
}

type NodeWithFakeChildren<T extends Node> = T & {
	[childNodesPatched]?: true;
}

function makeFragment<T extends Node>(
	node: T,
	fragment: Node[],
): asserts node is FragmentElement<T> {
	(node as FragmentElement<T>).frag = fragment;
}

function patchParentNode<T extends Node>(
	node: T,
	fakeParent: Node,
): asserts node is NodeWithFakeParent<T> {
	const nodeWithFakeParent = node as NodeWithFakeParent<T>;

	// Is there ever a case where we need to unset fakeParent?
	nodeWithFakeParent[$fakeParent] = fakeParent;

	if (parentNodePatched in nodeWithFakeParent) {
		return;
	}

	nodeWithFakeParent[parentNodePatched] = true;
	Object.defineProperty(
		nodeWithFakeParent,
		'parentNode',
		{
			get(this: NodeWithFakeParent<T>) {
				return this[$fakeParent] || this.parentElement;
			},
		},
	);
}

function patchNextSibling<T extends Node>(
	node: T,
): asserts node is NodeWithFakeSibling<T> {
	const nodeWithFakeSibling = node as NodeWithFakeSibling<T>;

	if (nextSiblingPatched in nodeWithFakeSibling) {
		return;
	}

	nodeWithFakeSibling[nextSiblingPatched] = true;

	Object.defineProperty(
		nodeWithFakeSibling,
		'nextSibling',
		{
			get(this: ChildNode) {
				const { childNodes } = this.parentNode!;
				const idx = Array.from(childNodes).indexOf(this);
				if (idx > -1) {
					return childNodes[idx + 1] || null;
				}

				return null;
			},
		},
	);
}

function getTopFragment(node: Node, fromParent: Node) {		
	while (node.parentNode !== fromParent) {
		const { parentNode } = node;
		if (parentNode) {
			node = parentNode;
		}
	}

	return node;
}


let getChildNodes: () => NodeListOf<ChildNode>;

// For a parent to get fake children
function getChildNodesWithFragments(node: Node) {
	// In case SSR
	if (!getChildNodes) {
		const childNodesDescriptor = Object.getOwnPropertyDescriptor(Node.prototype, 'childNodes');
		getChildNodes = childNodesDescriptor!.get!;
	}

	const realChildNodes = getChildNodes.apply(node);

	const childNodes = Array.from(realChildNodes).map(
		childNode => getTopFragment(childNode, node) as ChildNode,
	);

	// De-dupe child nodes that point to the same fragment
	return childNodes.filter(
		(childNode, index) => childNode !== childNodes[index - 1]
	);
}

function patchChildNodes<T extends Node>(
	node: T,
): asserts node is NodeWithFakeChildren<T> {
	const nodeWithFakeChildren = node as NodeWithFakeChildren<T>;
	if (childNodesPatched in nodeWithFakeChildren) {
		return;
	}

	nodeWithFakeChildren[childNodesPatched] = true;

	Object.defineProperty(
		nodeWithFakeChildren,
		'childNodes',
		{
			get(this: Node) {
				if (isFrag(this)) {
					return this.frag;
				}

				return getChildNodesWithFragments(this);
			},
		},
	);

	Object.defineProperty(
		node,
		'firstChild',
		{
			get(this: T) {
				return this.childNodes[0] || null;
			},
		},
	);

	node.hasChildNodes = function () {
		return this.childNodes.length > 0;
	};
}

/**
 * Methods overwritten for vue-frag to use internally
 */

// This works recursively. If child is also a frag, it automatically goes another level down
const before: ChildNode['before'] = function (
	this: FragmentElement,
	...nodes
) {
	(this.frag[0] as ChildNode).before(...nodes);
};

const remove: ChildNode['remove'] = function (this: FragmentElement) {
	// If the fragment is being removed, all children, including placeholder should be removed
	const { frag } = this;
	const removed = frag.splice(0, frag.length);
	removed.forEach(node => (node as ChildNode).remove());			
};


const isFrag = <T extends Node>(node: T): node is FragmentElement<T> => 'frag' in node;
const flatMap = <T, U>(
	array: T[],
	callback: (value: T) => U | U[],
): U[] => (
	// eslint-disable-next-line unicorn/no-array-callback-reference
	Array.prototype.concat(...array.map(callback))
);
function getFragmentLeafNodes<T extends Node>(children: T[]): T[] {
	return flatMap(children, (childNode) => (
		isFrag(childNode)
			? getFragmentLeafNodes(childNode.frag as T[])
			: childNode
	));
}

function addPlaceholder(
	node: FragmentElement,
	insertBeforeNode: Node,
) {
	const placeholder = node[$placeholder];

	(insertBeforeNode as ChildNode).before(placeholder);
	patchParentNode(placeholder, node);
	node.frag.unshift(placeholder);
}

const removeChild = function <T extends ChildNode>(
	this: Node,
	node: T,
) {	
	if (isFrag(this)) {
		// If this is a fragment element
		const hasChildInFragment = this.frag.indexOf(node);
		if (hasChildInFragment > -1) {
			const [removedNode] = this.frag.splice(hasChildInFragment, 1);

			// If last node, insert placeholder
			if (this.frag.length === 0) {
				addPlaceholder(this, removedNode);
			}

			node.remove();
		}
	} else {

		// For frag parent
		const children = getChildNodesWithFragments(this);
		const childNode = node as unknown as ChildNode;
		const hasChild = children.indexOf(childNode);

		if (hasChild > -1) {
			childNode.remove();
		}
	}

	return node;
}

const insertBefore: Node['insertBefore'] = function (
	this: ParentNode,
	insertNode,
	insertBeforeNode: ChildNode,
) {
	// Should this be leaf nodes?
	const insertNodes = isFrag(insertNode) ? insertNode.frag : [insertNode];

	// If this element is a fragment, insert nodes in virtual fragment
	if (isFrag(this)) {
		const { frag } = this;

		if (insertBeforeNode) {
			const index = frag.indexOf(insertBeforeNode);
			if (index > -1) {
				frag.splice(index, 0, ...insertNodes);
				(insertBeforeNode as ChildNode).before(...insertNodes);
			}
		} else {
			const lastNode = frag[frag.length - 1];
			frag.push(...insertNodes);
			(lastNode as ChildNode).after(...insertNodes);
		}

		removePlaceholder(this);
	} else {	
		const { childNodes } = this;
	
		if (insertBeforeNode) {
			if (Array.from(childNodes).indexOf(insertBeforeNode) > -1) {
				insertBeforeNode.before(...insertNodes);
			}	
		} else {
			this.append(...insertNodes);
		}
	}

	insertNodes.forEach(insertNode => {
		patchParentNode(insertNode, this);
	});

	const lastNode = insertNodes[insertNodes.length - 1];
	patchNextSibling(lastNode);

	return insertNode;
};

const appendChild: Node['appendChild'] = function (
	this: FragmentElement,
	node,
) {
	const { length } = this.frag;
	const lastChild = this.frag[length - 1] as ChildNode;
	
	lastChild.after(node);
	patchParentNode(node, this);

	removePlaceholder(this);

	this.frag.push(node);

	return node;
}

function removePlaceholder(node: FragmentElement) {
	const placeholder = node[$placeholder];
	if (node.frag[0] === placeholder) {
		node.frag.shift();
		placeholder.remove();
	}
}

const frag = {
	inserted(element: Element) {
		const {
			parentNode,
			nextSibling,
			previousSibling,
			childNodes
		} = element;

		const children = Array.from(childNodes);

		// If there are no children, insert a comment placeholder to mark the location
		const placeholder = document.createComment('');

		if (children.length === 0) {
			children.push(placeholder);
		}

		makeFragment(element, children);

		element[$placeholder] = placeholder;

		// Swap element with children (or placeholder)
		const fragment = document.createDocumentFragment();
		fragment.append(...getFragmentLeafNodes(children));
		element.replaceWith(fragment);

		children.forEach(node => {
			patchParentNode(node, element);
			patchNextSibling(node);
		});

		patchChildNodes(element);

		Object.assign(element, {
			remove,
			appendChild,
			insertBefore,
			removeChild,
			before,
		});

		Object.defineProperty(element, 'innerHTML', {
			set(this: FragmentElement, htmlString: string) {
				const domify = document.createElement('div');
				domify.innerHTML = htmlString;

				const oldNodesIndex = this.frag.length;

				// eslint-disable-next-line unicorn/prefer-dom-node-append
				Array.from(domify.childNodes).forEach(node => this.appendChild(node));
				domify.append(...this.frag.splice(0, oldNodesIndex));
			},
			get() {
				return '';
			},
		});

		if (parentNode) {
			Object.assign(parentNode, {
				removeChild,
				insertBefore,
			});
			patchParentNode(element, parentNode);
			patchChildNodes(parentNode);
		}

		if (nextSibling) {
			patchNextSibling(element);
		}

		if (previousSibling) {
			patchNextSibling(previousSibling);
		}
	},

	unbind(element: Element) {
		element.remove();
		// Not necessary to clean up .frag, etc because Node is scrapped
	},
};

export default frag;
