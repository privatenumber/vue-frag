const $fakeParent = Symbol();
const $fakeNextSibling = Symbol();
const $fakeChildren = Symbol();
const $placeholder = Symbol();

function addId(element) {
	if (element) {
		if (!('_id' in element)) {
			const id = Math.trunc(Math.random() * 100);
			element._id = [id, element.nodeName].join('-');
		}
		return element._id;
	}
}

function setFakeParent(node, fakeParent) {
	if (!node[$fakeParent]) {
		node[$fakeParent] = fakeParent;
		Object.defineProperty(node, 'parentNode', {
			get() {
				return this[$fakeParent] || this.parentElement;
			},
		});
	}
}

function setFakeNextSibling(node) {
	// eslint-disable-next-line no-prototype-builtins
	if (node.hasOwnProperty($fakeNextSibling)) {
		return;
	}

	Object.defineProperty(node, 'nextSibling', {
		get() {
			let nextSibling;
			if (this.frag) {
				const lastFakeChild = this.frag[this.frag.length - 1];

				if (lastFakeChild) {
					console.log('lastFakeChild', addId(lastFakeChild));
					nextSibling = lastFakeChild.nextSibling;
					console.log('lastFakeChild.nextSibling', addId(nextSibling));
				}
			} else {
				const childIndex = Array.from(this.parentElement.childNodes).indexOf(this);

				if (childIndex > -1) {
					nextSibling = this.parentElement.childNodes.item(childIndex + 1);
				}
			}

			if (nextSibling && !nextSibling.frag && nextSibling[$fakeParent]) {
				nextSibling = nextSibling[$fakeParent];
			}

			if (!nextSibling) {
				return null;
			}

			return nextSibling;
		},
	});

	node[$fakeNextSibling] = true;
}

const resetChildren = (frag, moveTo) => {
	const nodes = frag.splice(0);
	moveTo.append(...nodes);
	nodes.forEach((node) => {
		node[$fakeParent] = undefined;
	});
};

function insertBefore(insertNode, insertBeforeNode) {
	const insertNodes = insertNode.frag || [insertNode];

	// If this element is a fragment, insert nodes in virtual fragment
	if (this.frag) {
		const index = this.frag.indexOf(insertBeforeNode);
		if (index > -1) {
			this.frag.splice(index, 0, ...insertNodes);
		}
	}

	//  If this element has fake children, and targetNode is a fragmentNode
	if (this[$fakeChildren]) {
		const hasFakeChildren = this[$fakeChildren].get(insertBeforeNode);
		if (hasFakeChildren) {
			[insertBeforeNode] = hasFakeChildren; // update target with first child of fragment
		}
	}

	if (insertBeforeNode) {
		insertBeforeNode.before(...insertNodes);

		// If the reference the node is getting inserted before is a frag child
		// mock the nextSibling to point to the frag parent
		if (insertBeforeNode[$fakeParent]) {
			const lastNode = insertNodes[insertNodes.length - 1];
			setFakeNextSibling(lastNode);
		}
	} else {
		this.append(...insertNodes);
	}

	insertNodes.forEach((node) => {
		if (node.parentNode !== this) {
			setFakeParent(node, this);
		}
	});
}

function removeChild(node) {
	if (this.frag) {
		const nodeIndex = this.frag.indexOf(node);
		if (nodeIndex > -1) {
			const spliceArguments = [nodeIndex, 1];
			if (this.frag.length === 1) {
				const placeholder = this[$placeholder];
				this.frag[0].before(placeholder);
				spliceArguments.push(placeholder);
			}

			this.frag.splice(...spliceArguments);
		}
	}

	const fc = this[$fakeChildren];
	if (fc) {
		const hasFakeChildren = fc.get(node);
		if (hasFakeChildren) {
			resetChildren(hasFakeChildren, node);
			fc.delete(node);
			node[$fakeParent] = undefined;
			return;
		}
	}

	node.remove();
}

const parentPatches = {
	insertBefore,
	removeChild,
};

function patchParentMethods(parent, child, nodes) {
	if (!parent[$fakeChildren]) {
		parent[$fakeChildren] = new Map();
		Object.assign(parent, parentPatches);
	}

	parent[$fakeChildren].set(child, nodes);
}

const elementPatches = {
	insertBefore,

	before(newNode) {
		this.frag[0].before(newNode);
	},

	remove() {
		const placeholder = this[$placeholder];
		const { frag } = this;
		const removed = frag.splice(0, frag.length, placeholder);
		removed[0].before(this[$placeholder]);
		removed.forEach(element => element.remove());
	},

	removeChild,

	appendChild(node) {
		const { length } = this.frag;
		this.frag[length - 1].after(node);

		const placeholder = this[$placeholder];
		if (this.frag[0] === placeholder) {
			this.frag.splice(0, 1);
			placeholder.remove();
		}

		setFakeParent(node, this);
		this.frag.push(node);
	},
};

const frag = {
	inserted(element) {
		console.log('v-frag -- inserted', addId(element));

		// At inserted, we want to remove the element,
		// and insert its children in place of it
		const {
			parentNode,
			nextSibling,
			previousSibling,
		} = element;
		const childNodes = Array.from(element.childNodes);
		element.frag = childNodes;

		// If there are no children, insert a comment placeholder to mark the location
		const placeholder = document.createComment('');
		element[$placeholder] = placeholder;
		if (childNodes.length === 0) {
			childNodes.push(placeholder);
		}

		// Swap element with children (or placeholder)
		const fragment = document.createDocumentFragment();
		fragment.append(...childNodes);
		element.replaceWith(fragment);

		patchParentMethods(parentNode, element, childNodes);

		setFakeParent(element, parentNode);

		if (nextSibling) {
			setFakeNextSibling(element);
		}

		if (previousSibling) {
			setFakeNextSibling(previousSibling);
		}

		childNodes.forEach(node => setFakeParent(node, element));

		// Handle v-html
		Object.defineProperty(element, 'innerHTML', {
			set(htmlString) {
				const domify = document.createElement('div');
				domify.innerHTML = htmlString;

				const oldNodesIndex = element.frag.length;
				// eslint-disable-next-line unicorn/prefer-dom-node-append
				Array.from(domify.childNodes).forEach(node => element.appendChild(node));
				domify.append(...element.frag.splice(0, oldNodesIndex));
			},
			get() {
				return '';
			},
		});

		Object.assign(element, elementPatches);
	},

	unbind(element) {
		console.log('v-frag -- unbind', addId(element));

		resetChildren(element.frag, element);
		element[$placeholder].remove();

		// Not necessary to clean up .frag, etc because Node is scrapped
	},
};

export default frag;
