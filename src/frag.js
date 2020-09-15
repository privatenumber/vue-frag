const $fakeParent = Symbol();

function setFakeParent(node, fakeParent) {
	if (!node[$fakeParent]) {
		const {parentNode} = node;
		node[$fakeParent] = fakeParent;
		Object.defineProperty(node, 'parentNode', {
			get() {
				return this[$fakeParent] || parentNode;
			},
		});
	}
}

const $fakeChildren = Symbol();
const parentPatches = {
	insertBefore(newNode, refNode) {
		const hasFakeChildren = this[$fakeChildren].get(refNode);
		return Element.prototype.insertBefore.call(this, newNode, hasFakeChildren ? hasFakeChildren[0] : refNode);
	},
	removeChild(node) {
		const fc = this[$fakeChildren];
		const hasFakeChildren = fc.get(node);
		if (hasFakeChildren) {
			node.append(...hasFakeChildren.splice(0));
			fc.delete(node);
			return;
		}

		return Element.prototype.removeChild.call(this, node);
	},
};

function patchParent(parent, child, nodes) {
	if (!parent[$fakeChildren]) {
		parent[$fakeChildren] = new Map();
		Object.assign(parent, parentPatches);
	}

	parent[$fakeChildren].set(child, nodes);
}

const elementPatches = {
	insertBefore(newNode, refNode) {
		const idx = this.frag.indexOf(refNode);
		if (idx > -1) {
			this.frag.splice(idx, 0, newNode);
		}

		refNode.parentElement.insertBefore(newNode, refNode);
		setFakeParent(newNode, this);
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
		if (length) {
			this.frag[length - 1].after(node);
		} else {
			this.parentNode.append(node);
		}

		setFakeParent(node, this);
		this.frag.push(node);
	},
};

const frag = {
	inserted(element) {
		const nodes = Array.from(element.childNodes);

		const {parentNode: parent} = element;

		const fragment = document.createDocumentFragment();
		fragment.append(...nodes);
		element.replaceWith(fragment);

		element.frag = nodes;

		patchParent(parent, element, nodes);

		setFakeParent(element, parent);

		nodes.forEach(node => setFakeParent(node, element));

		Object.assign(element, elementPatches);
	},
};

export default frag;
