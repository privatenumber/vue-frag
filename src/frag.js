const $fakeParent = Symbol();

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

const $fakeChildren = Symbol();
const parentPatches = {
	insertBefore(newNode, refNode) {
		const hasFakeChildren = this[$fakeChildren].get(refNode);
		(hasFakeChildren ? hasFakeChildren[0] : refNode).before(newNode);
	},
	removeChild(node) {
		const fc = this[$fakeChildren];
		const hasFakeChildren = fc.get(node);
		if (hasFakeChildren) {
			// Revert fake parent on these
			node.append(...hasFakeChildren.splice(0));
			fc.delete(node);
			node[$fakeParent] = undefined;
			return;
		}

		node.remove();
	},
};

function patchParent(parent, child, nodes) {
	if (!parent[$fakeChildren]) {
		parent[$fakeChildren] = new Map();
		Object.assign(parent, parentPatches);
	}

	parent[$fakeChildren].set(child, nodes);
}

const $placeholder = Symbol();

const elementPatches = {
	insertBefore(newNode, refNode) {
		const idx = this.frag.indexOf(refNode);
		if (idx > -1) {
			this.frag.splice(idx, 0, newNode);
		}

		refNode.before(newNode);

		setFakeParent(newNode, this);
	},

	before(newNode) {
		this.frag[0].before(newNode);
	},

	remove() {
		const placeholder = this[$placeholder];
		const {frag} = this;
		const removed = frag.splice(0, frag.length, placeholder);
		removed[0].before(this[$placeholder]);
		removed.forEach(element => element.remove());
	},

	removeChild(node) {
		const idx = this.frag.indexOf(node);
		if (idx > -1) {
			this.frag.splice(idx, 1);
		}

		node.remove();
	},

	appendChild(node) {
		const {length} = this.frag;
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

		const {parentNode: parent} = element;

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

				const oldNodesIdx = element.frag.length;
				// eslint-disable-next-line unicorn/prefer-node-append
				Array.from(domify.childNodes).forEach(node => element.appendChild(node));
				domify.append(...element.frag.splice(0, oldNodesIdx));
			},
			get() {
				return '';
			},
		});

		Object.assign(element, elementPatches);
	},

	unbind(element) {
		if (element.frag.length > 0) { // Should always be true...
			element[$fakeParent] = undefined;
			const nodes = element.frag.splice(0);
			element.append(...nodes);
			nodes.forEach(node => {
				node[$fakeParent] = undefined;
			});

			element[$placeholder].remove();
			element.frag = undefined;
		}
	},
};

export default frag;
