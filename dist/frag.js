!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e="undefined"!=typeof globalThis?globalThis:e||self).Frag=t()}(this,(function(){"use strict";var e=Symbol();function t(t,n){if(!t[e]){var r=t.parentNode;t[e]=n,Object.defineProperty(t,"parentNode",{get:function(){return this[e]||r}})}}var n=Symbol(),r={insertBefore:function(e,t){var r=this[n].get(t);return Element.prototype.insertBefore.call(this,e,r?r[0]:t)},removeChild:function(e){var t=this[n],r=t.get(e);return r?(e.append.apply(e,r.splice(0)),void t.delete(e)):Element.prototype.removeChild.call(this,e)}};var i={insertBefore:function(e,n){var r=this.frag.indexOf(n);r>-1&&this.frag.splice(r,0,e),n.parentElement.insertBefore(e,n),t(e,this)},removeChild:function(e){var t=this.frag.indexOf(e);t>-1&&this.frag.splice(t,1),e.remove()},appendChild:function(e){var n=this.frag.length;n?this.frag[n-1].after(e):this.parentNode.append(e),t(e,this),this.frag.push(e)}};return{inserted:function(e){var o=Array.from(e.childNodes),a=e.parentNode,f=document.createDocumentFragment();f.append.apply(f,o),e.replaceWith(f),e.frag=o,function(e,t,i){e[n]||(e[n]=new Map,Object.assign(e,r)),e[n].set(t,i)}(a,e,o),t(e,a),o.forEach((function(n){return t(n,e)})),Object.assign(e,i)}}}));
