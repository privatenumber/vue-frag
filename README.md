# vue-frag <a href="https://npm.im/vue-frag"><img src="https://badgen.net/npm/v/vue-frag"></a> <a href="https://npm.im/vue-frag"><img src="https://badgen.net/npm/dm/vue-frag"></a> <a href="https://packagephobia.now.sh/result?p=vue-frag"><img src="https://packagephobia.now.sh/badge?p=vue-frag"></a> <a href="https://bundlephobia.com/result?p=vue-frag"><img src="https://badgen.net/bundlephobia/minzip/vue-frag"></a>

Vue 2 fragment directive to return multiple root elements

```vue
<template>
    <div v-frag>
        <div>Root element 1</div>
        <div>Root element 2</div>
        <div>Root element 3</div>
    </div>
</template>
```


## 🙋‍♂️ Why?
- **🔥 Multiple root nodes** Without creating a functional component!
- **⭐️ SSR** Unwraps the root element on client-side post-hydration!
- **🐥 Tiny** Only `618 B`!

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

#### Returning multiple root nodes
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

### How does this work?
Vue associates vNodes with specific DOM references so once a component has mounted, the DOM nodes can be moved around and Vue will still be able to mutate them by reference. The Frag directive simply replaces the root element of a component in the DOM with it's children upon DOM insertion, and monkey-patches native properties like `parentNode` on the children to make Vue think they're still using the component root element.


