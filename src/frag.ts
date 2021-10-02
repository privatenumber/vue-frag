import { serializeNode } from '../test/utils';

const $fakeParent = Symbol();
const nextSiblingPatched = Symbol();
const parentNodePatched = Symbol();
const $placeholder = Symbol();

function patchParentNode(
	node: Node,
	fakeParent: ParentNode,
) {
	// Is there ever a case where we need to unset fakeParent?
	node[$fakeParent] = fakeParent;

	if (node[parentNodePatched]) {
		return;
	}

	node[parentNodePatched] = true;
	Object.defineProperty(node, 'parentNode', {
		get(this: Node) {
			return this[$fakeParent] || this.parentElement;
		},
	});
}

function patchNextSibling(
	node: Node,
) {
	if (nextSiblingPatched in node) {
		return;
	}

	node[nextSiblingPatched] = true;

	Object.defineProperty(
		node,
		'nextSibling',
		{
			get() {
				const { childNodes } = this.parentNode;
				const idx = childNodes.indexOf(this);
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

const { get: getChildNodes } = Object.getOwnPropertyDescriptor(Node.prototype, 'childNodes')!;

// For a parent to get fake children
function getChildNodesWithFragments(node: Node) {
	const realChildNodes: NodeListOf<ChildNode> = getChildNodes.apply(node);

	const childNodes = Array.from(realChildNodes).map(
		childNode => getTopFragment(childNode, node) as ChildNode,
	);

	// De-dupe child nodes that point to the same fragment
	return childNodes.filter(
		(childNode, i, array) => childNode !== array[i - 1]
	);
}

const childNodesPatched = Symbol();
function patchChildNodes(
	element: Node,
	fakeChildNodes?: Node[],
) {
	if (fakeChildNodes) {
		element.frag = fakeChildNodes;
	}

	if (childNodesPatched in element) {
		return;
	}

	element[childNodesPatched] = true;

	Object.defineProperty(element, 'childNodes', {
		get(this: Node) {
			if (this.frag) {
				return this.frag;
			}

			return getChildNodesWithFragments(this);
		},
	});

	Object.defineProperty(element, 'firstChild', {
		get(this: Node) {
			return this.childNodes[0] || null;
		},
	});

	element.hasChildNodes = function () {
		return this.childNodes.length > 0;
	};
}

/**
 * Methods overwritten for vue-frag to use internally
 */

// This works recursively. If child is also a frag, it automatically goes another level down
const before: ChildNode['before'] = function (newNode) {
	this.frag[0].before(newNode);
};

const remove: ChildNode['remove'] = function (this: ChildNode) {
	// If the fragment is being removed, all children, including placeholder should be removed
	const { frag } = this;
	const removed = frag.splice(0, frag.length);
	removed.forEach(node => node.remove());			
};


type FragmentElement = Element & {
	frag: ChildNode[];
	[$placeholder]: Comment;
	[$fakeParent]: ParentNode;
}

function getFragmentLeafNodes(children: ChildNode[]) {
	return children.flatMap(childNode => childNode.frag ? getFragmentLeafNodes(childNode.frag) : childNode);
}


// function patchFragmentMethods(element: Element): asserts element is FragmentElement {

// }

function addPlaceholder(node: Node, insertBeforeNode: ChildNode) {
	const placeholder = node[$placeholder];

	insertBeforeNode.before(placeholder);
	patchParentNode(placeholder, node);
	node.frag.unshift(placeholder);
}

const removeChild: Node['removeChild'] = function (node) {
	if (this.frag) {
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

const insertBefore: Node['insertBefore'] = function (insertNode, insertBeforeNode) {
	// Should this be leaf nodes?
	const insertNodes = insertNode.frag || [insertNode];

	// If this element is a fragment, insert nodes in virtual fragment
	if (this.frag) {
		const { frag } = this;

		if (insertBeforeNode) {
			const index = frag.indexOf(insertBeforeNode);
			if (index > -1) {
				frag.splice(index, 0, ...insertNodes);
				insertBeforeNode.before(...insertNodes);
			}
		} else {
			const lastNode = frag[frag.length - 1];
			frag.push(...insertNodes);
			lastNode.after(...insertNodes);
		}

		removePlaceholder(this);
	} else {	
		const { childNodes } = this;
	
		if (insertBeforeNode) {
			if (childNodes.indexOf(insertBeforeNode) > -1) {
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

const appendChild: Node['appendChild'] = function (node) {
	const { length } = this.frag;
	const lastChild = this.frag[length - 1];
	
	lastChild.after(node);
	patchParentNode(node, this);

	removePlaceholder(this);

	this.frag.push(node);

	return node;
}

function removePlaceholder(node: Node) {
	const placeholder = node[$placeholder];
	if (node.frag[0] === placeholder) {
		node.frag.shift();
		placeholder.remove();
	}
}

const frag = {
	inserted(el: Element) {
		const element = el as FragmentElement;
		// At inserted, we want to remove the element,
		// and insert its children in place of it
		const {
			parentNode,
			nextSibling,
			previousSibling,
			childNodes
		} = element;

		const children = Array.from(childNodes);

		// If there are no children, insert a comment placeholder to mark the location
		const placeholder = document.createComment('');

		element[$placeholder] = placeholder;
		if (children.length === 0) {
			children.push(placeholder);
		}

		if (parentNode) {
			patchParentNode(element, parentNode);
			patchChildNodes(parentNode);
			parentNode.removeChild = removeChild;
			parentNode.insertBefore = insertBefore;
		}

		if (nextSibling) {
			patchNextSibling(element);
		}

		if (previousSibling) {
			patchNextSibling(previousSibling);
		}

		patchChildNodes(element, children);

		// Swap element with children (or placeholder)
		const fragment = document.createDocumentFragment();
		fragment.append(...getFragmentLeafNodes(children));
		element.replaceWith(fragment);

		children.forEach(node => {
			// And sibling?
			patchParentNode(node, element);
		});

		// Vue doesn't use this, but for the sake of convenience in removing nodes
		// test: removing all nodes, and re-inserting them
		element.remove = remove;
		element.appendChild = appendChild;
		element.insertBefore = insertBefore;
		element.removeChild = removeChild;
		element.before = before;

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
	},

	unbind(element: Element) {
		element.remove();
		// Not necessary to clean up .frag, etc because Node is scrapped
	},
};

export default frag;
