# vue-frag <a href="https://npm.im/vue-frag"><img src="https://badgen.net/npm/v/vue-frag"></a> <a href="https://npm.im/vue-frag"><img src="https://badgen.net/npm/dm/vue-frag"></a> <a href="https://packagephobia.now.sh/result?p=vue-frag"><img src="https://packagephobia.now.sh/badge?p=vue-frag"></a> <a href="https://bundlephobia.com/result?p=vue-frag"><img src="https://badgen.net/bundlephobia/minzip/vue-frag"></a>

Use [Vue 3's Fragment feature](https://v3.vuejs.org/guide/migration/fragments.html) in Vue 2 to return multiple root elements

```vue
<template>
    <div v-frag> ⬅ This root element is unwrapped and removed on render!

        <li>Element 1</li>
        <li>Element 2</li>
        <li>Element 3</li>
    </div>
</template>
```

👉 Try out a [demo in this CodePen](https://codepen.io/hirokiosame/pen/PoNVZbV)!

<sub>If you like this project, please star it & [follow me](https://github.com/privatenumber) to see what other cool projects I'm working on! ❤️</sub>

## 🌟 Features
- **✅ Multiple root nodes** Without creating a functional component!
- **🔥 SSR** Unwraps the root element on client-side post-hydration!
- **⚡️ Directives** Supports `v-if`, `v-for`, and `v-html`!
- **👩‍🔬 Battle-tested** Checkout the tests [here](/test/)!

## 🚀 Install
```sh
npm i vue-frag
```

## 🚦 Quick Setup

#### Register globally
Make it available anywhere in your Vue application.

```js
import frag from 'vue-frag';
Vue.directive('frag', frag);
```

#### Register locally
Explicitly register it to a component you want to use it in.

```vue
...

<script>
import frag from 'vue-frag';

export default {
    directives: {
        frag
    },

    ...
};
</script>
```

## 👨🏻‍🏫 Examples

#### Returning multiple root nodes <a href="https://codepen.io/hirokiosame/pen/PoNVZbV"><img src="https://img.shields.io/badge/codepen.io-demo-blue" valign="bottom"></a>
```vue
<template>
    <div v-frag> <!-- This element will be unwrapped -->

        <div v-for="i in 10">
            {{ i }}
        </div>
    </div>
</template>
```

#### Unwrapping the root node from a component
```vue
<template>
    <div>
        <!-- Unwraps the root node of some-custom-component -->
        <some-custom-component v-frag />
    </div>
</template>
```

#### Supports v-if too
```vue
<template>
    <div v-frag>
        <template v-if />
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

## 💁‍♀️ FAQ

### When would I want to return multiple root nodes?

Whenever you feel like the root-element of your component adds no value and is unnecessary, or is messing up your HTML output. This usually happens when you want to return a list of elements like `<li>List Items</li>` or `<tr><td>Table Rows</td></tr>` but you have to wrap it in a `<div>`.

In Vue 2, it's possible to return multiple nodes with a [Functional Component](https://vuejs.org/v2/guide/render-function.html#Functional-Components) but functional components are stateless (no `data()` or [life-cycle hooks](https://vuejs.org/v2/guide/instance.html#Lifecycle-Diagram)), doesn't support `methods`, doesn't have very good template support, and can lead to SSR bugs (eg. mismatching nodes).

Related VueJS Issues / Stackoverflow Qs:
- [vuejs/vue #7088](https://github.com/vuejs/vue/issues/7088)
- [vuejs/vue #7606](https://github.com/vuejs/vue/issues/7606)
- [Stackoverflow: A way to render multiple root elements in VueJS?](https://stackoverflow.com/questions/47511674/a-way-to-render-multiple-root-elements-on-vuejs-with-v-for-directive)

### How is this different from [vue-fragment](https://www.npmjs.com/package/vue-fragment)?
They are both designed to do the same thing. However, [vue-fragment](https://github.com/Thunberg087/vue-fragment) is a component and vue-frag is a directive. I made vue-frag when I saw vue-fragment didn't have any tests to ensure correct behavior, had a lot of unattended issues, and didn't seem actively maintained. In terms of size, they are both small but vue-frag is slightly smaller (`993B` vs `798B`).


### How does this work?
Vue associates vNodes with specific DOM references so once a component has mounted, the DOM nodes can be moved around and Vue will still be able to mutate them by reference. The Frag directive simply replaces the root element of a component in the DOM with it's children upon DOM insertion, and monkey-patches native properties like `parentNode` on the children to make Vue think they're still using the component root element.

### Does `v-show` work?
Unfortunately not. `v-show` works by setting `style="display: none"` on the root element of the target component, and with `vue-frag` unwrapping and removing the root element, there would be no grouping-element to apply the `display: none` to. If the fragment returned elements, it's possible to apply it to each child-node, but it's possible for them to be text-nodes which cannot be styled.


## 👨‍👩‍👧 Related
- [vue-subslot](https://github.com/privatenumber/vue-subslot) - 💍 pick out specific elements from component `<slot>`s
- [vue-vnode-syringe](https://github.com/privatenumber/vue-vnode-syringe) - 🧬 Add attributes and event-listeners to `<slot>` content 💉
- [vue-proxi](https://github.com/privatenumber/vue-proxi) - 💠 Tiny proxy component
- [vue-pseudo-window](https://github.com/privatenumber/vue-pseudo-window) - 🖼 Declaratively interface window/document in your Vue template
- [vue-v](https://github.com/privatenumber/vue-v) - render vNodes via component template
