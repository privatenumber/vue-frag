function setFakeParent(node, fakeParent) {
	Object.defineProperty(node, 'parentNode', {
		get: () => fakeParent,
	});
}

const frag = {
	inserted(element) {
		const nodes = Array.from(element.childNodes);

		const parent = element.parentNode; /* Replace with template */
		const fragment = document.createDocumentFragment();
		fragment.append(...element.childNodes);
		element.replaceWith(fragment);

		nodes.forEach(node => setFakeParent(node, element));

		element.frag = nodes;

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
					parent.append(node);
				}

				setFakeParent(node, element);

				nodes.push(node);
			},
		});
	},
};

export default frag;
