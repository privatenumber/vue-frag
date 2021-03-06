const $fakeParent = Symbol();
const $fakeNextSibling = Symbol();
const $fakeChildren = Symbol();
const $placeholder = Symbol();

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

function setFakeNextSibling(node, fakeNextSibling) {
	// eslint-disable-next-line no-prototype-builtins
	if (!node.hasOwnProperty($fakeNextSibling)) {
		node[$fakeNextSibling] = fakeNextSibling;
		Object.defineProperty(node, 'nextSibling', {
			get() {
				// eslint-disable-next-line no-prototype-builtins
				if (!this.hasOwnProperty($fakeNextSibling)) {
					const childIndex = Array.from(this.parentNode.childNodes).indexOf(this);
					return this.parentNode.childNodes.item(childIndex + 1);
				}

				return this[$fakeNextSibling];
			},
		});
	}
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

	if (this.frag) {
		const index = this.frag.indexOf(insertBeforeNode);
		if (index > -1) {
			this.frag.splice(index, 0, ...insertNodes);
		}
	}

	if (this[$fakeChildren]) {
		const hasFakeChildren = this[$fakeChildren].get(insertBeforeNode);
		if (hasFakeChildren) {
			[insertBeforeNode] = hasFakeChildren;
		}
	}

	if (insertBeforeNode) {
		insertBeforeNode.before(...insertNodes);
	} else {
		this.append(...insertNodes);
	}

	insertNodes.forEach(node => setFakeParent(node, this));
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
		const {
			parentNode,
			nextSibling,
		} = element;
		const childNodes = Array.from(element.childNodes);
		element.frag = childNodes;

		const placeholder = document.createComment('');
		element[$placeholder] = placeholder;
		if (childNodes.length === 0) {
			childNodes.push(placeholder);
		}

		const fragment = document.createDocumentFragment();
		fragment.append(...childNodes);
		element.replaceWith(fragment);

		patchParentMethods(parentNode, element, childNodes);

		setFakeParent(element, parentNode);
		setFakeNextSibling(element, nextSibling);

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
		resetChildren(element.frag, element);
		element[$placeholder].remove();

		// Not necessary to clean up .frag, etc because Node is scrapped
	},
};

export default frag;
