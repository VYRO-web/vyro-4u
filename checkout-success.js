(async function(){
  const S=VyroStore,status=document.getElementById('checkoutStatus'),root=document.getElementById('orderResult');
  if(S.freeMode()){
    status.textContent='Payments are currently disabled. VYRO guides are available as free PDF downloads.';
    root.innerHTML='<p><a class="btn btn-primary" href="shop.html">Browse free guides</a></p>';
    const b=document.getElementById('checkAgain'); if(b)b.hidden=true;
    return;
  }
  const id=new URLSearchParams(location.search).get('order_id');let attempts=0,timer;
  if(!id){status.textContent='No order was specified. Visiting this page does not confirm payment.';return;}
  if(!/^[0-9a-f-]{36}$/i.test(id)){status.textContent='This order reference is not valid.';return;}
  async function check(){try{if(!await S.session()){status.innerHTML='Sign in to check this order. <a class="text-link" href="'+S.escape(S.loginURL())+'">Sign in</a>';return;}
    const{order,items}=await S.request('/api/order?id='+encodeURIComponent(id)),labels={pending:'Your payment is awaiting confirmation. You can return to My Library at any time.',paid:'Payment confirmed. Your purchase is available in My Library.',failed:'This payment failed. You can return to the product and try again.',cancelled:'This checkout was cancelled.',refunded:'This order was refunded. Access follows the store’s refund policy.',partially_refunded:'This order was partially refunded. Check My Library for your current access.'};
    status.textContent=labels[order.status]||'We are checking this order.';root.innerHTML='<p>Order '+S.escape(order.id)+'</p><ul>'+(items||[]).map(i=>'<li>'+S.escape(i.product_name)+' — '+S.escape(S.money(i.unit_price,i.currency))+'</li>').join('')+'</ul>';
    if(order.status==='paid')for(const i of items||[])VyroCart.remove(i.product_id);if(order.status==='pending'&&++attempts<15)timer=setTimeout(check,4000);
  }catch(e){status.textContent=e.message;}}
  document.getElementById('checkAgain').addEventListener('click',()=>{clearTimeout(timer);attempts=0;check();});window.addEventListener('pagehide',()=>clearTimeout(timer));await check();
})();
