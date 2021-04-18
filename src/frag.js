const $fakeParent = Symbol();
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

const resetChildren = (frag, moveTo) => {
	const nodes = frag.splice(0);
	moveTo.append(...nodes);
	nodes.forEach((node) => {
		node[$fakeParent] = undefined;
	});
};

function insertBefore(insertNode, referenceNode) {
	const insertNodes = insertNode.frag || [insertNode];

	if (this.frag) {
		const index = this.frag.indexOf(referenceNode);
		if (index > -1) {
			this.frag.splice(index, 0, ...insertNodes);
		}
	}

	if (this[$fakeChildren]) {
		const hasFakeChildren = this[$fakeChildren].get(referenceNode);
		if (hasFakeChildren) {
			[referenceNode] = hasFakeChildren;
		}
	}

	if (referenceNode) {
		referenceNode.before(...insertNodes);
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

function patchParent(parent, child, nodes) {
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
		const nodes = Array.from(element.childNodes);

		const { parentNode: parent } = element;

		const placeholder = document.createComment('');
		element[$placeholder] = placeholder;
		if (nodes.length === 0) {
			nodes.push(placeholder);
		}

		const fragment = document.createDocumentFragment();
		fragment.append(...nodes);
		element.replaceWith(fragment);

		element.frag = nodes;

		patchParent(parent, element, nodes);

		setFakeParent(element, parent);

		nodes.forEach(node => setFakeParent(node, element));

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
	},
};

export default frag;
