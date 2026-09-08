/* Browser-safe client. The server owns authorization, price and delivery decisions. */
(function () {
  'use strict';
  const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function safeURL(v){try{if(!v)return '';const u=new URL(v,location.origin);return u.protocol==='https:'||(u.origin===location.origin&&u.protocol==='http:')?u.href:'';}catch{return '';}}
  function money(v,c='USD'){if(v==null||!Number.isFinite(Number(v)))return 'Price to be announced';try{return new Intl.NumberFormat('en',{style:'currency',currency:c}).format(Number(v));}catch{return v+' '+c;}}
  async function session(){if(!window.VyroAuth?.configured())return null;const{data,error}=await VyroAuth.client().auth.getSession();if(error)throw error;return data?.session||null;}
  async function request(path,{method='GET',body,authenticated=true}={}){
    const headers={Accept:'application/json'};let requestUser;
    if(authenticated){const s=await session();if(!s){const e=new Error('Please sign in to continue.');e.status=401;throw e;}requestUser=s.user.id;headers.Authorization='Bearer '+s.access_token;}
    if(body!==undefined)headers['Content-Type']='application/json';
    const r=await fetch(path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(25000)}),d=await r.json().catch(()=>null);
    if(authenticated&&(await session())?.user?.id!==requestUser){const e=new Error('Your account changed. Please try again.');e.status=401;throw e;}
    if(!r.ok||!d){const e=new Error(typeof d?.error==='string'?d.error:'The store could not complete this request. Please try again.');e.status=r.status;throw e;}return d;
  }
  function notice(message){let e=document.getElementById('vyro-toast');if(!e){e=document.createElement('div');e.id='vyro-toast';e.className='vyro-toast';e.setAttribute('role','status');document.body.append(e);}e.textContent=message;e.classList.add('vyro-toast--visible');clearTimeout(e._timer);e._timer=setTimeout(()=>e.classList.remove('vyro-toast--visible'),6000);}
  const loginURL=(path=location.pathname+location.search)=>'/account.html?mode=login&returnTo='+encodeURIComponent(path);
  async function checkout(id,button){const label=button?.textContent;if(button){button.disabled=true;button.textContent='Preparing checkout…';}try{
    if(!await session()){const p=window.VyroCatalog?.data?.products.find(p=>p.id===id);location.assign(loginURL('/product.html?id='+encodeURIComponent(p?.slug||id)+'&intent=buy'));return;}
    const d=await request('/api/checkout',{method:'POST',body:{product_id:id}}),u=new URL(d.checkout_url);
    if(u.protocol!=='https:'||!(u.hostname==='whop.com'||u.hostname.endsWith('.whop.com')))throw new Error('The checkout link was not valid.');location.assign(u.href);
  }catch(e){notice(e.message);}finally{if(button){button.disabled=false;button.textContent=label;}}}
  window.VyroStore={escape,safeURL,money,session,request,notice,loginURL,checkout};
})();
