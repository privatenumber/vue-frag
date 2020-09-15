function setFakeParent(node, fakeParent) {
	if (!Object.getOwnPropertyDescriptor(node, 'parentNode')) {
		Object.defineProperty(node, 'parentNode', {
			get: () => fakeParent,
		});
	}
}

const frag = {
	inserted(element) {
		const nodes = Array.from(element.childNodes);

		const {parentNode: parent} = element;

		const fragment = document.createDocumentFragment();
		fragment.append(...element.childNodes);
		element.replaceWith(fragment);

		element.frag = nodes;

		const {insertBefore, removeChild} = parent;
		Object.assign(parent, {
			insertBefore(newNode, refNode) {
				return insertBefore.call(parent, newNode, refNode === element ? nodes[0] : refNode);
			},
			removeChild(node) {
				if (node === element) {
					element.append(...element.frag);
					element.frag.splice(0);
					return;
				}

				return Reflect.apply(removeChild, this, arguments);
			},
		});

		setFakeParent(element, parent);

		nodes.forEach(node => setFakeParent(node, element));

		Object.assign(element, {
			insertBefore(newNode, refNode) {
				const idx = nodes.indexOf(refNode);
				if (idx > -1) {
					nodes.splice(idx, 0, newNode);
				}

				const node = refNode.parentElement.insertBefore(newNode, refNode);
				setFakeParent(node, element);
				return node;
			},

			removeChild(node) {
				const idx = nodes.indexOf(node);
				if (idx > -1) {
					nodes.splice(idx, 1);
				}

				return node.remove();
			},

			appendChild(node) {
				const length_ = nodes.length;
				if (length_ > 0) {
					const refNode = nodes[length_ - 1];
					refNode.after(node);
				} else {
					parent.append(node); // Test
				}

				setFakeParent(node, element);

				nodes.push(node);
			},
		});
	},
};

export default frag;
