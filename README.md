# vue-frag <a href="https://npm.im/vue-frag"><img src="https://badgen.net/npm/v/vue-frag"></a> <a href="https://npm.im/vue-frag"><img src="https://badgen.net/npm/dm/vue-frag"></a> <a href="https://packagephobia.now.sh/result?p=vue-frag"><img src="https://packagephobia.now.sh/badge?p=vue-frag"></a> <a href="https://bundlephobia.com/result?p=vue-frag"><img src="https://badgen.net/bundlephobia/minzip/vue-frag"></a>

Vue 2 fragment directive to unwrap root elements

## 🙋‍♂️ Why?
- **🔥 Multiple root nodes** Without creating a functional component!
- **⭐️ SSR** Unwraps the root element on client-side post-hydration!
- **🐥 Tiny** Only `277 B`!

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
        <some-custom-component v-frag />
    </div>
</template>
```
