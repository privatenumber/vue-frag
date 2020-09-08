const frag = {
	inserted(element) {
		const fragment = document.createDocumentFragment();
		fragment.append(...element.childNodes);
		element.replaceWith(fragment);
	},
};

export default frag;
