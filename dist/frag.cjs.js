"use strict";var e=Symbol();function t(t,r){if(!t[e]){var n=t.parentNode;t[e]=r,Object.defineProperty(t,"parentNode",{get:function(){return this[e]||n}})}}var r=Symbol(),n={insertBefore:function(e,t){var n=this[r].get(t);return Element.prototype.insertBefore.call(this,e,n?n[0]:t)},removeChild:function(e){var t=this[r],n=t.get(e);return n?(e.append.apply(e,n.splice(0)),void t.delete(e)):Element.prototype.removeChild.call(this,e)}};var i={insertBefore:function(e,r){var n=this.frag.indexOf(r);n>-1&&this.frag.splice(n,0,e),r.parentElement.insertBefore(e,r),t(e,this)},removeChild:function(e){var t=this.frag.indexOf(e);t>-1&&this.frag.splice(t,1),e.remove()},appendChild:function(e){var r=this.frag.length;r?this.frag[r-1].after(e):this.parentNode.append(e),t(e,this),this.frag.push(e)}},a={inserted:function(e){var a=Array.from(e.childNodes),o=e.parentNode,s=document.createDocumentFragment();s.append.apply(s,a),e.replaceWith(s),e.frag=a,function(e,t,i){e[r]||(e[r]=new Map,Object.assign(e,n)),e[r].set(t,i)}(o,e,a),t(e,o),a.forEach((function(r){return t(r,e)})),Object.assign(e,i)}};module.exports=a;
