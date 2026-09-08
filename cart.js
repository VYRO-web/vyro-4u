/* Device-local saved product IDs only; digital licenses have quantity one. */
(function(){
  'use strict';const key='vyro.cart.v1';let items=[];
  function parse(v){try{const a=JSON.parse(v||'[]');return Array.isArray(a)?[...new Set(a.filter(x=>typeof x==='string'&&x.length<100))].slice(0,100):[];}catch{return [];}}
  try{items=parse(localStorage.getItem(key));}catch{/* Disabled storage still allows an in-memory cart. */}
  function render(){document.querySelectorAll('[data-cart-count]').forEach(e=>{e.textContent=items.length;e.style.display=items.length?'flex':'none';});}
  function save(){try{localStorage.setItem(key,JSON.stringify(items));}catch{VyroStore.notice('Your browser cannot save this cart between visits.');}render();window.dispatchEvent(new CustomEvent('vyro:cart'));}
  window.VyroCart={add(id){if(!items.includes(id)&&items.length<100){items.push(id);save();VyroStore.notice('Saved to your cart.');}else VyroStore.notice('This product is already saved.');},remove(id){items=items.filter(x=>x!==id);save();},clear(){items=[];save();},count:()=>items.length,list:()=>[...items],render};
  window.addEventListener('storage',e=>{if(e.key===key){items=parse(e.newValue);render();window.dispatchEvent(new CustomEvent('vyro:cart'));}});
  document.addEventListener('DOMContentLoaded',()=>{render();document.querySelectorAll('[data-search-form]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();location.assign('/shop.html?q='+encodeURIComponent(f.querySelector('input').value.trim()));}));
    const toggle=document.querySelector('[data-menu-toggle]'),nav=document.querySelector('[data-mobile-nav]');if(toggle&&nav){nav.inert=true;toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';nav.classList.toggle('mobile-nav--open',open);nav.inert=!open;toggle.setAttribute('aria-expanded',String(open));});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){nav.classList.remove('mobile-nav--open');nav.inert=true;toggle.setAttribute('aria-expanded','false');toggle.focus();}});}
    document.addEventListener('click',e=>{const a=e.target.closest('[data-add]'),b=e.target.closest('[data-buy]'),r=e.target.closest('[data-remove]');if(a)VyroCart.add(a.dataset.add);if(b&&!b.disabled)VyroStore.checkout(b.dataset.buy,b);if(r)VyroCart.remove(r.dataset.remove);});
  });
})();
