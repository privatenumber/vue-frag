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
		if (hasFakeChildren) {
			refNode = hasFakeChildren[0];
		}

		return Element.prototype.insertBefore.call(this, newNode, refNode);
	},
	removeChild(node) {
		const fc = this[$fakeChildren];
		const hasFakeChildren = fc.get(node);
		if (hasFakeChildren) {
			node.append(...hasFakeChildren);
			hasFakeChildren.splice(0);
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

		const node = refNode.parentElement.insertBefore(newNode, refNode);
		setFakeParent(node, this);
		return node;
	},

	removeChild(node) {
		const idx = this.frag.indexOf(node);
		if (idx > -1) {
			this.frag.splice(idx, 1);
		}

		return node.remove();
	},

	appendChild(node) {
		const length_ = this.frag.length;
		if (length_ > 0) {
			const refNode = this.frag[length_ - 1];
			refNode.after(node);
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
