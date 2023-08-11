# vue-frag <a href="https://npm.im/vue-frag"><img src="https://badgen.net/npm/v/vue-frag"></a> <a href="https://npm.im/vue-frag"><img src="https://badgen.net/npm/dm/vue-frag"></a> <a href="https://bundlephobia.com/result?p=vue-frag"><img src="https://badgen.net/bundlephobia/minzip/vue-frag"></a>

Use [Vue 3's Fragment feature](https://v3.vuejs.org/guide/migration/fragments.html) in Vue 2 to return multiple root elements.

```vue
<template>
    <Fragment> ⬅ This root element will not exist in the DOM

        <li>Element 1</li>
        <li>Element 2</li>
        <li>Element 3</li>
    </Fragment>
</template>

<script>
import { Fragment } from 'vue-frag'

export default {
    components: {
        Fragment
    }
}
</script>
```

👉 [Try it out on CodePen](https://codepen.io/hirokiosame/pen/PoNVZbV)!

### Features
- **✅ Multiple root nodes** Without creating a functional component!
- **🔥 SSR** Unwraps the root element on client-side post-hydration!
- **⚡️ Directives** Supports `v-if`, `v-for`, and `v-html`!
- **👩‍🔬 Battle-tested** Checkout the tests [here](/test/)!


<table>
   <td>
       <strong>🔥 Pro-tip</strong>
       <br><br>
       Want to be able to just have multiple root-nodes in your SFC without a wrapper?
       Use <a href="https://github.com/privatenumber/vue-frag-plugin">vue-frag-plugin</a> to automatically inject vue-frag so that you can return multiple root nodes without a fragment component!
   </td>
</table>

<br>

<p align="center">
	<a href="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=platinum">
		<picture>
			<source width="830" media="(prefers-color-scheme: dark)" srcset="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=platinum&image=dark">
			<source width="830" media="(prefers-color-scheme: light)" srcset="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=platinum&image">
			<img width="830" src="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=platinum&image" alt="Premium sponsor banner">
		</picture>
	</a>
</p>

## 🚀 Install
```sh
npm i vue-frag
```

## 🚦 Quick Setup
You can either choose to use the _Component_ or _Directive_ API.

### Component API
The Component API is designed to be used at the root of the template. It should feel intuitive to use and cover most use-cases.

Import `Fragment` and use it as the root element of your component:
```vue
<template>
    <Fragment>
        Hello world!
    </Fragment>
</template>

<script>
import { Fragment } from 'vue-frag'

export default {
    components: {
        Fragment
    }
}
</script>
```

#### Register globally
[Globally registering](https://vuejs.org/v2/guide/components-registration.html) the component lets you use it without needing to import it every time.
```js
import { Fragment } from 'vue-frag'

Vue.component('Fragment', Fragment)
```

### Directive API
Use the Directive API to have more nuanced control over placement. For example, if you want to unwrap the root node of a component on the usage-end.

The Component API uses the Directive API under the hood.

```vue
<template>
    <div v-frag>
        Hello world!
    </div>
</template>

<script>
import frag from 'vue-frag'

export default {
    directives: {
        frag
    }
}
</script>
```

#### Register globally
Make it available anywhere in your Vue application.

```js
import frag from 'vue-frag'

Vue.directive('frag', frag)
```

## 👨🏻‍🏫 Examples

#### Returning multiple root nodes <a href="https://codepen.io/hirokiosame/pen/PoNVZbV"><img src="https://img.shields.io/badge/codepen.io-demo-blue" valign="bottom"></a>
Component API
```html
<template>
    <Fragment> <!-- This element will be unwrapped -->

        <div v-for="i in 10">
            {{ i }}
        </div>
    </Fragment>
</template>
```


Directive API
```html
<template>
    <div v-frag> <!-- This element will be unwrapped -->

        <div v-for="i in 10">
            {{ i }}
        </div>
    </div>
</template>
```

#### Unwrapping the root node from a component
Use the Directive API to unwrap the root node of a component.

```html
<template>
    <div>
        <!-- Unwraps the root node of some-custom-component -->
        <SomeCustomComponent v-frag />
    </div>
</template>
```

#### Supports v-if too
```html
<template>
    <div v-frag>
        <template v-if="isShown">
            Hello world!
        </template>
    </div>
</template>
```

#### Access fragment DOM nodes
```vue
<template>
    <div v-frag>
        Hello world
    </div>
</template>

<script>
export default {
    mounted() {
        console.log(this.$el.frag)
    }
}
</script>
```

<br>

<p align="center">
	<a href="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=gold">
		<picture>
			<source width="830" media="(prefers-color-scheme: dark)" srcset="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=gold&image=dark">
			<source width="830" media="(prefers-color-scheme: light)" srcset="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=gold&image">
			<img width="830" src="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=gold&image" alt="Premium sponsor banner">
		</picture>
	</a>
</p>

## 💁‍♀️ FAQ

### When would I want to return multiple root nodes?

Whenever you feel like the root-element of your component adds no value and is unnecessary, or is messing up your HTML output. This usually happens when you want to return a list of elements like `<li>List Items</li>` or `<tr><td>Table Rows</td></tr>` but you have to wrap it in a `<div>`.

In Vue 2, it's possible to return multiple nodes with a [Functional Component](https://vuejs.org/v2/guide/render-function.html#Functional-Components) but functional components are stateless (no `data()` or [life-cycle hooks](https://vuejs.org/v2/guide/instance.html#Lifecycle-Diagram)), doesn't support `methods`, doesn't have very good template support, and can lead to SSR bugs (eg. mismatching nodes).

Related VueJS Issues / Stackoverflow Qs:
- [vuejs/vue #7088](https://github.com/vuejs/vue/issues/7088)
- [vuejs/vue #7606](https://github.com/vuejs/vue/issues/7606)
- [Stackoverflow: A way to render multiple root elements in VueJS?](https://stackoverflow.com/questions/47511674/a-way-to-render-multiple-root-elements-on-vuejs-with-v-for-directive)

### How does this work?
vue-frag works by tricking Vue.js to think that the root element is still in the DOM, when it's actually not.

When vue-frag is applied to an element, it uses the [`inserted` directive hook](https://vuejs.org/v2/guide/custom-directive.html#Hook-Functions) to swap the element out with its children to remove itself from the DOM. It then patches surrounding DOM nodes (eg. parent, sibling, children) to make them think that the element is still in the DOM.

Here are all the DOM APIs Vue.js uses that are patched:

- [`insertBefore()`](https://github.com/vuejs/vue/blob/531b7619b137aecd71441e1ea53dae3066d71bc8/dist/vue.js#L5748)

- [`removeChild()`](https://github.com/vuejs/vue/blob/531b7619b137aecd71441e1ea53dae3066d71bc8/dist/vue.js#L5752)

- [`appendChild()`](https://github.com/vuejs/vue/blob/531b7619b137aecd71441e1ea53dae3066d71bc8/dist/vue.js#L5756)

- [`hasChildNodes()`](https://github.com/vuejs/vue/blob/531b7619b137aecd71441e1ea53dae3066d71bc8/dist/vue.js#L6427)

- [`parentNode`](https://github.com/vuejs/vue/blob/531b7619b137aecd71441e1ea53dae3066d71bc8/dist/vue.js#L5760)

- [`nextSibling`](https://github.com/vuejs/vue/blob/531b7619b137aecd71441e1ea53dae3066d71bc8/dist/vue.js#L5764)

- [`firstChild`](https://github.com/vuejs/vue/blob/531b7619b137aecd71441e1ea53dae3066d71bc8/dist/vue.js#L6447)

- [`childNodes`](https://github.com/vuejs/vue/blob/531b7619b137aecd71441e1ea53dae3066d71bc8/dist/vue.js#L7667)

- [`innerHTML`](https://github.com/vuejs/vue/blob/531b7619b137aecd71441e1ea53dae3066d71bc8/dist/vue.js#L6431)


### Does `v-show` work?
[Like in Vue 3](https://jsfiddle.net/hirokiosame/pebL1cdx/), `v-show` does not work on components that return a fragment. `v-show` works by setting `style="display: none"` on the root element of the target component. With vue-frag removing the root element, there would be no grouping-element to apply the `display: none` to. If the fragment returned elements, it's possible to apply it to each child-node, but it's possible for them to be text-nodes which cannot be styled.


## 👨‍👩‍👧 Related
- [vue-frag-plugin](https://github.com/privatenumber/vue-frag-plugin) - Build-time plugin to seamlessly use multiple root nodes
- [vue-subslot](https://github.com/privatenumber/vue-subslot) - 💍 pick out specific elements from component `<slot>`s
- [vue-vnode-syringe](https://github.com/privatenumber/vue-vnode-syringe) - 🧬 Add attributes and event-listeners to `<slot>` content 💉
- [vue-proxi](https://github.com/privatenumber/vue-proxi) - 💠 Tiny proxy component
- [vue-pseudo-window](https://github.com/privatenumber/vue-pseudo-window) - 🖼 Declaratively interface window/document in your Vue template
- [vue-v](https://github.com/privatenumber/vue-v) - render vNodes via component template

## Sponsors

<p align="center">
	<a href="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=silver1">
		<picture>
			<source width="410" media="(prefers-color-scheme: dark)" srcset="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=silver1&image=dark">
			<source width="410" media="(prefers-color-scheme: light)" srcset="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=silver1&image">
			<img width="410" src="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=silver1&image" alt="Premium sponsor banner">
		</picture>
	</a>
	<a href="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=silver2">
		<picture>
			<source width="410" media="(prefers-color-scheme: dark)" srcset="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=silver2&image=dark">
			<source width="410" media="(prefers-color-scheme: light)" srcset="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=silver2&image">
			<img width="410" src="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=silver2&image" alt="Premium sponsor banner">
		</picture>
	</a>
</p>

<p align="center">
	<a href="https://github.com/sponsors/privatenumber">
		<img src="https://cdn.jsdelivr.net/gh/privatenumber/sponsors/sponsorkit/sponsors.svg">
	</a>
</p>
