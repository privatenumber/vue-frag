!function(e,n){"object"==typeof exports&&"undefined"!=typeof module?module.exports=n():"function"==typeof define&&define.amd?define(n):(e="undefined"!=typeof globalThis?globalThis:e||self).Frag=n()}(this,(function(){"use strict";function e(e,n){Object.getOwnPropertyDescriptor(e,"parentNode")||Object.defineProperty(e,"parentNode",{get:function(){return n}})}return{inserted:function(n){var t=Array.from(n.childNodes),r=n.parentNode,o=document.createDocumentFragment();o.append.apply(o,n.childNodes),n.replaceWith(o),t.forEach((function(t){return e(t,n)})),n.frag=t,Object.assign(n,{insertBefore:function(r,o){var i=t.indexOf(o);i>-1&&t.splice(i,0,r);var f=o.parentElement.insertBefore(r,o);return e(f,n),f},removeChild:function(e){var n=t.indexOf(e);return n>-1&&t.splice(n,1),e.remove()},appendChild:function(o){var i=t.length;i>0?t[i-1].after(o):r.append(o);e(o,n),t.push(o)}})}}}));
