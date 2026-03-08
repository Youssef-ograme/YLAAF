import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, addDoc, query, orderBy
} from "firebase/firestore";

const ADMIN_PASSWORD = "YLAAF1337";
const G = "#C9A96E";
const DARK = "#0d0d0d";

function useNightMode() {
  const isNight=()=>{const h=new Date().getHours();return h>=20||h<7;};
  const [night,setNight]=useState(isNight());
  const toggle=()=>setNight(n=>!n);
  return [night,toggle];
}

const defaultProducts = [
  { id:"1", name:"عباية كلاسيكية سوداء", price:450, category:"عباية كلاسيكية", images:["https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=600&q=80","https://images.unsplash.com/photo-1609505848912-b7c3b8b4beda?w=600&q=80"], badge:"جديد" },
  { id:"2", name:"عباية مطرزة ذهبية", price:680, category:"عباية مطرزة", images:["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80","https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=600&q=80"], badge:"الأكثر مبيعاً" },
  { id:"3", name:"عباية سهرة فاخرة", price:850, category:"عباية سهرة", images:["https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&q=80","https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80"], badge:"حصري" },
  { id:"4", name:"عباية كاجوال عصرية", price:380, category:"عباية كاجوال", images:["https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80"], badge:"" },
  { id:"5", name:"عباية مطرزة بالورود", price:720, category:"عباية مطرزة", images:["https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=600&q=80"], badge:"تخفيض" },
  { id:"6", name:"عباية كلاسيكية رمادية", price:420, category:"عباية كلاسيكية", images:["https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80"], badge:"" },
];

const translations = {
  ar: { dir:"rtl", home:"الرئيسية", shop:"المتجر", about:"من نحن", cart:"السلة", addToCart:"أضف للسلة", total:"المجموع", empty:"سلتك فارغة", name:"اسمك", phone:"رقم الهاتف", address:"العنوان", send:"إرسال الطلب عبر واتساب", hero1:"", hero2:"", heroSub:"فاخر. أصيل. مغربي.", explore:"تسوقي الآن", featured:"أحدث التشكيلات", free:"توصيل مجاني", freeSub:"في جميع أنحاء المغرب 🇲🇦", adminTitle:"لوحة التحكم", adminPass:"كلمة السر", adminLogin:"دخول", addProduct:"إضافة منتج", productName:"اسم المنتج", productPrice:"السعر (درهم)", productImage:"صور المنتج", save:"حفظ", delete:"حذف", noOrders:"لا توجد طلبات", wrongPass:"كلمة السر غلط!", orderSuccess:"✅ تم إرسال طلبك!", categories:["الكل","عباية كلاسيكية","عباية مطرزة","عباية سهرة","عباية كاجوال"], logout:"خروج", viewOrders:"الطلبات", manageProducts:"المنتجات", contact:"تواصل معنا", whatsapp:"واتساب", addToCartShort:"أضف للسلة", pieces:"منتج" },
  fr: { dir:"ltr", home:"Accueil", shop:"Boutique", about:"À propos", cart:"Panier", addToCart:"Ajouter", total:"Total", empty:"Panier vide", name:"Votre nom", phone:"Téléphone", address:"Adresse", send:"Commander via WhatsApp", hero1:"", hero2:"", heroSub:"Luxueux. Authentique. Marocain.", explore:"Découvrir", featured:"Nouveautés", free:"Livraison gratuite", freeSub:"Partout au Maroc 🇲🇦", adminTitle:"Administration", adminPass:"Mot de passe", adminLogin:"Connexion", addProduct:"Ajouter produit", productName:"Nom", productPrice:"Prix (DH)", productImage:"Images", save:"Enregistrer", delete:"Supprimer", noOrders:"Aucune commande", wrongPass:"Mot de passe incorrect!", orderSuccess:"✅ Commande envoyée!", categories:["Tout","Abaya Classique","Abaya Brodée","Abaya Soirée","Abaya Casual"], logout:"Déconnexion", viewOrders:"Commandes", manageProducts:"Produits", contact:"Contact", whatsapp:"WhatsApp", addToCartShort:"Ajouter", pieces:"articles" },
  en: { dir:"ltr", home:"Home", shop:"Shop", about:"About", cart:"Cart", addToCart:"Add to Cart", total:"Total", empty:"Cart is empty", name:"Your name", phone:"Phone", address:"Address", send:"Order via WhatsApp", hero1:"", hero2:"", heroSub:"Luxury. Authentic. Moroccan.", explore:"Shop Now", featured:"New Arrivals", free:"Free delivery", freeSub:"All over Morocco 🇲🇦", adminTitle:"Admin Panel", adminPass:"Password", adminLogin:"Login", addProduct:"Add Product", productName:"Name", productPrice:"Price (DH)", productImage:"Images", save:"Save", delete:"Delete", noOrders:"No orders yet", wrongPass:"Wrong password!", orderSuccess:"✅ Order sent!", categories:["All","Classic Abaya","Embroidered Abaya","Evening Abaya","Casual Abaya"], logout:"Logout", viewOrders:"Orders", manageProducts:"Products", contact:"Contact", whatsapp:"WhatsApp", addToCartShort:"Add", pieces:"items" },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cinzel+Decorative:wght@700;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body,input,select,button{font-family:'Amiri',Georgia,serif}
  button{transition:all .25s cubic-bezier(.22,.68,0,1.2);cursor:pointer}
  button:active{transform:scale(0.96)!important}

  @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
  @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(0.6)}}
  @keyframes slideIn{from{transform:translateX(110%)}to{transform:translateX(0)}}
  @keyframes scaleIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
  @keyframes revealUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
  @keyframes drawLine{from{width:0}to{width:100%}}
  @keyframes logoGlow{0%,100%{text-shadow:0 0 20px rgba(201,169,110,0.3)}50%{text-shadow:0 0 50px rgba(201,169,110,0.8),0 0 80px rgba(201,169,110,0.4)}}
  @keyframes rotateBorder{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes loadBar{from{width:0}to{width:100%}}
  @keyframes particleFloat{0%{transform:translateY(0) translateX(0) scale(1);opacity:0.8}50%{opacity:1}100%{transform:translateY(-120px) translateX(var(--dx,20px)) scale(0);opacity:0}}
  @keyframes ringPulse{0%{transform:translate(-50%,-50%) scale(0.8);opacity:0.6}100%{transform:translate(-50%,-50%) scale(2.2);opacity:0}}
  @keyframes spinSlow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes countFlip{0%{transform:rotateX(0deg)}50%{transform:rotateX(-90deg)}100%{transform:rotateX(0deg)}}
  @keyframes starPop{0%{transform:scale(0) rotate(-30deg);opacity:0}70%{transform:scale(1.3) rotate(5deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}
  @keyframes reviewSlide{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
  @keyframes igHover{from{transform:scale(1)}to{transform:scale(1.06)}}
  @keyframes tickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

  .anim-fadeup{animation:fadeUp .8s ease forwards}
  .anim-fadeup-2{animation:fadeUp .8s .18s ease both}
  .anim-fadeup-3{animation:fadeUp .8s .35s ease both}

  .gold-text{
    background:linear-gradient(90deg,#C9A96E 0%,#f5e199 40%,#C9A96E 60%,#8b5e3c 100%);
    background-size:200%;
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    animation:shimmer 5s linear infinite;
  }

  .card{
    transition:transform .4s cubic-bezier(.22,.68,0,1.2),box-shadow .4s,opacity .4s;
    opacity:1;
    min-width:0;
    overflow:hidden;
    word-break:break-word;
    transform-style:preserve-3d;
  }
  .card.visible{opacity:1;transform:translateY(0)}
  .card:hover .cimg{transform:scale(1.08)}
  .card:hover .card-overlay-btn{opacity:1!important;transform:translateY(0)!important}
  .cimg{transition:transform .6s cubic-bezier(.22,.68,0,1.2)}
  .card-overlay-btn{opacity:0!important;transform:translateY(10px)!important;transition:all .3s ease!important}

  .btn-gold{background:linear-gradient(135deg,#C9A96E,#8b5e3c);color:#fff;border:none;font-weight:700;letter-spacing:.05em}
  .btn-gold:hover{background:linear-gradient(135deg,#dbb87a,#9a6840);box-shadow:0 8px 28px rgba(201,169,110,0.5);transform:scale(1.03)}
  .btn-dark{background:#0d0d0d;color:#fff;border:none;font-weight:700}
  .btn-dark:hover{background:#2a2a2a;box-shadow:0 8px 20px rgba(0,0,0,0.35);transform:scale(1.02)}

  .pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(255px,1fr));gap:28px}
  @media(max-width:640px){.pgrid{grid-template-columns:repeat(2,1fr);gap:10px;padding:0 2px}}
  .pgrid > *{min-width:0}
  .cats{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:38px}
  @media(max-width:640px){.cats{flex-wrap:nowrap;overflow-x:auto;padding-bottom:8px;scrollbar-width:none}.cats::-webkit-scrollbar{display:none}}
  .cw{width:440px}@media(max-width:480px){.cw{width:100vw}}
  .aw{width:min(720px,96vw)}@media(max-width:480px){.aw{width:100vw;border-radius:0!important;max-height:100vh!important}}
  .ag{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:13px}
  @media(max-width:480px){.ag{grid-template-columns:repeat(2,1fr)}}
  .abg{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
  @media(max-width:600px){.abg{grid-template-columns:1fr}}
  .divider{display:flex;align-items:center;gap:12px;max-width:280px;margin:0 auto 44px}
  .divider::before,.divider::after{content:'';flex:1;height:1px;background:linear-gradient(to right,transparent,#C9A96E,transparent)}
  .nav-link{cursor:pointer;font-weight:700;font-family:'Amiri',serif;letter-spacing:.04em;transition:color .2s;padding-bottom:4px}
  @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-20px) scale(0.9)}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
  @keyframes toastOut{from{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}to{opacity:0;transform:translateX(-50%) translateY(-16px) scale(0.92)}}
  @keyframes pageIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes cartBounce{0%{transform:scale(1)}30%{transform:scale(1.35)}60%{transform:scale(0.9)}100%{transform:scale(1)}}
  @keyframes heartPop{0%{transform:scale(1)}40%{transform:scale(1.5)}70%{transform:scale(0.85)}100%{transform:scale(1)}}
  @keyframes cursorPulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.7}50%{transform:translate(-50%,-50%) scale(1.5);opacity:0.3}}
  @keyframes typewriterBlink{0%,100%{opacity:1}50%{opacity:0}}

  @keyframes cursorPulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.7}50%{transform:translate(-50%,-50%) scale(1.5);opacity:0.3}}
  .page-section{animation:pageIn .45s cubic-bezier(.22,.68,0,1.2) both}


  .load-bar{height:2px;background:linear-gradient(90deg,#C9A96E,#f5e199,#C9A96E);animation:loadBar 2s ease forwards;border-radius:2px}
  .star-btn:hover{transform:scale(1.25)}
  .star-anim{animation:starPop .35s cubic-bezier(.22,.68,0,1.2) forwards}

  .review-item{animation:reviewSlide .4s ease forwards}

  .ig-thumb{overflow:hidden;border-radius:12px;cursor:pointer;position:relative}
  .ig-thumb img{transition:transform .5s cubic-bezier(.22,.68,0,1.2);width:100%;height:100%;object-fit:cover;display:block}
  .ig-thumb:hover img{transform:scale(1.08)}
  .ig-thumb .ig-overlay{position:absolute;inset:0;background:rgba(13,13,13,0);transition:background .3s;display:flex;align-items:center;justify-content:center}
  .ig-thumb:hover .ig-overlay{background:rgba(13,13,13,0.45)}
  .ig-thumb .ig-icon{opacity:0;transition:opacity .3s;color:#fff}
  .ig-thumb:hover .ig-icon{opacity:1}

  .countdown-digit{display:inline-flex;flex-direction:column;align-items:center;min-width:52px;background:rgba(0,0,0,0.4);border:1px solid rgba(201,169,110,0.3);border-radius:12px;padding:10px 6px 6px;backdrop-filter:blur(8px)}
  .countdown-num{font-family:'Cinzel Decorative',serif;font-size:28px;font-weight:900;color:#fff;line-height:1}
  .countdown-label{font-family:'Amiri',serif;font-size:9px;color:rgba(201,169,110,0.8);letter-spacing:0.12em;margin-top:4px;text-transform:uppercase}

  .ticker{overflow:hidden;white-space:nowrap}
  .ticker-inner{display:inline-flex;animation:tickerScroll 18s linear infinite}
  .ticker-inner:hover{animation-play-state:paused}
`;


function Logo({ inverted=false, size="md", tagline="" }) {
  const fs={sm:22,md:30,lg:50}[size]||30;
  const ss={sm:8,md:11,lg:15}[size]||11;
  const dark=inverted?"#fff":DARK;
  return (
    <div dir="ltr" style={{display:"inline-flex",flexDirection:"column",alignItems:"center",gap:4,lineHeight:1,userSelect:"none"}}>
      <div style={{fontFamily:"'Cinzel Decorative',Georgia,serif",fontSize:fs,fontWeight:900,letterSpacing:"0.18em",display:"flex"}}>
        <span style={{color:dark}}>Y</span><span style={{color:G}}>L</span><span style={{color:dark}}>A</span><span style={{color:G}}>A</span><span style={{color:dark}}>F</span>
      </div>
      {tagline&&<div style={{display:"flex",alignItems:"center",gap:6,width:"100%"}}>
        <div style={{flex:1,height:1,background:`linear-gradient(to right,transparent,${G})`}}/>
        <span style={{fontSize:ss,color:G,whiteSpace:"nowrap",fontStyle:"italic",fontFamily:"'Amiri',serif",letterSpacing:"0.1em"}}>{tagline}</span>
        <div style={{flex:1,height:1,background:`linear-gradient(to left,transparent,${G})`}}/>
      </div>}
    </div>
  );
}

function useParallax(factor=0.3){
  const [offset,setOffset]=useState(0);
  useEffect(()=>{
    const h=()=>setOffset(window.scrollY*factor);
    window.addEventListener("scroll",h,{passive:true});
    return()=>window.removeEventListener("scroll",h);
  },[factor]);
  return offset;
}

function useScrollReveal(ref){
  const [visible,setVisible]=useState(false);
  useEffect(()=>{
    const el=ref.current;if(!el)return;
    const obs=new IntersectionObserver(([e])=>{if(e.isIntersecting){setVisible(true);obs.disconnect();}},{threshold:0.15});
    obs.observe(el);
    return()=>obs.disconnect();
  },[ref]);
  return visible;
}

function useTypewriter(texts, speed=60, pause=2000) {
  const [display, setDisplay] = useState("");
  const [idx, setIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(()=>{
    if(!texts||!texts.length)return;
    const current = texts[idx];
    let timeout;
    if(!deleting && display.length < current.length) {
      timeout = setTimeout(()=>setDisplay(current.slice(0, display.length+1)), speed);
    } else if(!deleting && display.length === current.length) {
      timeout = setTimeout(()=>setDeleting(true), pause);
    } else if(deleting && display.length > 0) {
      timeout = setTimeout(()=>setDisplay(display.slice(0,-1)), speed/2);
    } else if(deleting && display.length === 0) {
      setDeleting(false);
      setIdx(i=>(i+1)%texts.length);
    }
    return()=>clearTimeout(timeout);
  },[display, deleting, idx, texts]);
  return display;
}

function useIsMobile(){
  const [m,setM]=useState(window.innerWidth<768);
  useEffect(()=>{const h=()=>setM(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  return m;
}


function ProductPopup({product,t,onAdd,onClose,notify,db,lang}) {
  const [idx,setIdx]=useState(0);
  const [anim,setAnim]=useState("");
  const [selSize,setSelSize]=useState("");
  const mob=useIsMobile();
  const imgs=product.images||[product.image];
  const hasSizes=product.sizes&&product.sizes.length>0;

  const goTo=(newIdx,dir)=>{
    setAnim(dir==="next"?"slideOutLeft":"slideOutRight");
    setTimeout(()=>{
      setIdx(newIdx);
      setAnim(dir==="next"?"slideInRight":"slideInLeft");
      setTimeout(()=>setAnim(""),350);
    },200);
  };
  const next=()=>goTo((idx+1)%imgs.length,"next");
  const prev=()=>goTo((idx-1+imgs.length)%imgs.length,"prev");

  // swipe support
  const touchStart=useRef(null);
  const handleTouchStart=(e)=>touchStart.current=e.touches[0].clientX;
  const handleTouchEnd=(e)=>{
    if(!touchStart.current)return;
    const diff=touchStart.current-e.changedTouches[0].clientX;
    if(Math.abs(diff)>50){diff>0?next():prev();}
    touchStart.current=null;
  };

  return (
    <div style={{position:"fixed",inset:0,zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{`
        @keyframes slideInRight{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideInLeft{from{opacity:0;transform:translateX(-60px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideOutLeft{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-60px)}}
        @keyframes slideOutRight{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(60px)}}
        @keyframes popupBackdrop{from{opacity:0}to{opacity:1}}
        @keyframes popupCard{from{opacity:0;transform:scale(0.85) translateY(40px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes popupImgReveal{from{clip-path:inset(100% 0 0 0);opacity:0}to{clip-path:inset(0% 0 0 0);opacity:1}}
        @keyframes popupInfoSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmerSweep{0%{transform:translateX(-100%) skewX(-15deg)}100%{transform:translateX(250%) skewX(-15deg)}}
        @keyframes goldLine{from{width:0;opacity:0}to{width:100%;opacity:1}}
      `}</style>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(18px)",animation:"popupBackdrop .3s ease"}}/>
      <div style={{position:"relative",width:mob?"100vw":"min(480px,95vw)",maxHeight:"95vh",display:"flex",flexDirection:"column",alignItems:"center",animation:"popupCard .45s cubic-bezier(.22,.68,0,1.2)"}}>
        {/* Close */}
        <button onClick={onClose} style={{position:"absolute",top:12,right:mob?12:0,zIndex:10,background:"rgba(0,0,0,0.7)",color:"#fff",border:`1px solid rgba(255,255,255,0.15)`,borderRadius:"50%",width:38,height:38,fontSize:17,cursor:"pointer",backdropFilter:"blur(4px)"}}>✕</button>

        {/* Image */}
        <div style={{width:"100%",borderRadius:mob?0:24,overflow:"hidden",background:"#111",position:"relative",maxHeight:mob?"72vh":"78vh"}}
          onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <img
            src={imgs[idx]} alt={product.name}
            style={{width:"100%",height:mob?"72vh":"78vh",objectFit:"cover",display:"block",
              animation:anim?`${anim} .35s ease`:"popupImgReveal .6s cubic-bezier(.22,.68,0,1.2)"}}
          />
          {/* Gold shimmer sweep on open */}
          <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",borderRadius:mob?0:24}}>
            <div style={{position:"absolute",top:0,left:0,width:"40%",height:"100%",background:"linear-gradient(90deg,transparent,rgba(201,169,110,0.18),transparent)",animation:"shimmerSweep .9s .2s ease forwards",opacity:0}}/>
          </div>
          {/* Gold border reveal */}
          <div style={{position:"absolute",inset:0,borderRadius:mob?0:24,border:"1px solid rgba(201,169,110,0.3)",pointerEvents:"none"}}/>
          {/* Gradient overlay */}
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:"45%",background:"linear-gradient(to top,rgba(0,0,0,0.85),transparent)",pointerEvents:"none",borderRadius:mob?0:"0 0 24px 24px"}}/>
          {/* Arrows */}
          {imgs.length>1&&<>
            <button onClick={prev} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)",color:"#fff",border:`1px solid rgba(255,255,255,0.15)`,borderRadius:"50%",width:42,height:42,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>‹</button>
            <button onClick={next} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)",color:"#fff",border:`1px solid rgba(255,255,255,0.15)`,borderRadius:"50%",width:42,height:42,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>›</button>
          </>}
          {/* Dots */}
          {imgs.length>1&&<div style={{position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",display:"flex",gap:6}}>
            {imgs.map((_,i)=><div key={i} onClick={()=>goTo(i,i>idx?"next":"prev")} style={{width:i===idx?22:7,height:7,borderRadius:4,background:i===idx?G:"rgba(255,255,255,0.4)",transition:"all .3s",cursor:"pointer"}}/>)}
          </div>}
        </div>

        {/* Bottom info + add button */}
        <div style={{width:"100%",padding:mob?"14px 16px":"16px 20px",display:"flex",flexDirection:"column",gap:10,animation:"popupInfoSlide .5s .25s cubic-bezier(.22,.68,0,1.2) both"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
            <div>
              <p style={{color:G,fontSize:11,fontWeight:700,marginBottom:3,fontFamily:"'Amiri',serif"}}>{product.category}</p>
              <p style={{color:"#fff",fontSize:mob?16:18,fontWeight:700,fontFamily:"'Amiri',serif"}}>{product.name}</p>
            </div>
            <p style={{color:"#fff",fontSize:20,fontWeight:700,fontFamily:"'Cinzel Decorative',serif",flexShrink:0}}>{product.price} <span style={{fontSize:12,color:"#aaa"}}>DH</span></p>
          </div>
          {hasSizes&&<div>
            <p style={{color:"rgba(255,255,255,0.6)",fontSize:11,marginBottom:6,fontFamily:"'Amiri',serif"}}>{t.dir==="rtl"?"اختار المقاس":"Choose size"}</p>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {product.sizes.map(s=><button key={s} onClick={()=>setSelSize(s)} style={{padding:"5px 14px",borderRadius:14,border:`2px solid ${selSize===s?G:"rgba(255,255,255,0.25)"}`,background:selSize===s?G:"transparent",color:selSize===s?"#fff":"rgba(255,255,255,0.8)",fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .2s"}}>{s}</button>)}
            </div>
          </div>}
          <button className="btn-gold" onClick={()=>{if(hasSizes&&!selSize){notify&&notify("⚠️ "+(t.dir==="rtl"?"اختار المقاس أولاً":"Choose a size first"));return;}onAdd({...product,size:selSize});onClose();}} style={{padding:"12px",borderRadius:14,fontSize:15,opacity:hasSizes&&!selSize?0.6:1}}>+ {t.addToCartShort}</button>
          {db&&<ReviewsSection productId={product.id} db={db} lang={lang}/>}
        </div>
      </div>
    </div>
  );
}

// ── STAR RATING DISPLAY ──────────────────────────────────────
function StarDisplay({rating=0, size=16, color="#C9A96E"}){
  return(
    <span style={{display:"inline-flex",gap:2}}>
      {[1,2,3,4,5].map(i=>(
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i<=Math.round(rating)?color:"none"}
          stroke={color} strokeWidth="1.8">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </span>
  );
}

// ── REVIEWS SECTION (shows inside ProductPopup) ───────────────
function ReviewsSection({productId, db, lang}){
  const [reviews,setReviews]=useState([]);
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({name:"",comment:"",rating:5});
  const [submitting,setSubmitting]=useState(false);
  const [hoverStar,setHoverStar]=useState(0);

  useEffect(()=>{
    if(!productId||!db)return;
    const q=query(collection(db,"reviews_"+productId),orderBy("date","desc"));
    const unsub=onSnapshot(q,snap=>setReviews(snap.docs.map(d=>({...d.data(),id:d.id}))));
    return()=>unsub();
  },[productId]);

  const avg=reviews.length?reviews.reduce((a,r)=>a+r.rating,0)/reviews.length:0;

  const submit=async()=>{
    if(!form.name.trim()||!form.comment.trim())return;
    setSubmitting(true);
    await addDoc(collection(db,"reviews_"+productId),{...form,date:new Date().toISOString()});
    setForm({name:"",comment:"",rating:5});setShowForm(false);setSubmitting(false);
  };

  return(
    <div style={{borderTop:"1px solid rgba(255,255,255,0.1)",marginTop:8,paddingTop:14}}>
      {/* Summary */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,paddingBottom:10,borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <StarDisplay rating={avg} size={15}/>
          <span style={{color:"rgba(255,255,255,0.7)",fontSize:12,fontFamily:"'Amiri',serif"}}>
            {avg>0?avg.toFixed(1)+" ":""}{reviews.length} {lang==="ar"?"تقييم":lang==="fr"?"avis":"reviews"}
          </span>
        </div>
        <button onClick={()=>setShowForm(s=>!s)} style={{background:"rgba(201,169,110,0.15)",border:"1px solid rgba(201,169,110,0.35)",color:"#C9A96E",borderRadius:20,padding:"5px 14px",fontSize:11,fontWeight:700,fontFamily:"'Amiri',serif",cursor:"pointer"}}>
          {showForm?(lang==="ar"?"إلغاء":lang==="fr"?"Annuler":"Cancel"):(lang==="ar"?"أضف تقييم":lang==="fr"?"Évaluer":"Rate")}
        </button>
      </div>

      {/* Form */}
      {showForm&&(
        <div style={{background:"rgba(255,255,255,0.05)",borderRadius:14,padding:14,marginBottom:14,border:"1px solid rgba(201,169,110,0.2)",animation:"reviewSlide .3s ease"}}>
          {/* Star picker */}
          <div style={{display:"flex",gap:4,marginBottom:10,justifyContent:"center"}}>
            {[1,2,3,4,5].map(i=>(
              <button key={i} className="star-btn" onMouseEnter={()=>setHoverStar(i)} onMouseLeave={()=>setHoverStar(0)}
                onClick={()=>setForm(f=>({...f,rating:i}))}
                style={{background:"none",border:"none",cursor:"pointer",padding:2}}>
                <svg width="28" height="28" viewBox="0 0 24 24"
                  fill={i<=(hoverStar||form.rating)?"#C9A96E":"none"}
                  stroke="#C9A96E" strokeWidth="1.8"
                  style={{transition:"all .15s",transform:i<=(hoverStar||form.rating)?"scale(1.2)":"scale(1)"}}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </button>
            ))}
          </div>
          <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
            placeholder={lang==="ar"?"اسمك":lang==="fr"?"Votre nom":"Your name"}
            style={{width:"100%",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:9,padding:"8px 12px",color:"#fff",fontSize:13,fontFamily:"'Amiri',serif",outline:"none",marginBottom:8}}/>
          <textarea value={form.comment} onChange={e=>setForm(f=>({...f,comment:e.target.value}))}
            placeholder={lang==="ar"?"شاركنا رأيك...":lang==="fr"?"Votre avis...":"Share your thoughts..."}
            rows={2}
            style={{width:"100%",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:9,padding:"8px 12px",color:"#fff",fontSize:13,fontFamily:"'Amiri',serif",outline:"none",resize:"none",marginBottom:10}}/>
          <button onClick={submit} disabled={submitting}
            style={{width:"100%",background:"linear-gradient(135deg,#C9A96E,#8b5e3c)",color:"#fff",border:"none",borderRadius:10,padding:"10px",fontWeight:700,fontSize:13,fontFamily:"'Amiri',serif",cursor:"pointer",opacity:submitting?0.6:1}}>
            {submitting?"...":(lang==="ar"?"إرسال":lang==="fr"?"Envoyer":"Submit")}
          </button>
        </div>
      )}

      {/* List */}
      <div style={{display:"flex",flexDirection:"column",gap:10,maxHeight:200,overflowY:"auto"}}>
        {reviews.length===0&&!showForm&&(
          <p style={{color:"rgba(255,255,255,0.3)",fontSize:12,fontFamily:"'Amiri',serif",textAlign:"center",padding:"12px 0"}}>
            {lang==="ar"?"كن أول من يقيّم هذا المنتج ✨":lang==="fr"?"Soyez le premier à évaluer ✨":"Be the first to review ✨"}
          </p>
        )}
        {reviews.map((r,i)=>(
          <div key={r.id} className="review-item" style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"10px 13px",border:"1px solid rgba(201,169,110,0.1)",animationDelay:`${i*0.05}s`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,#C9A96E,#8b5e3c)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",fontFamily:"'Cinzel Decorative',serif"}}>{r.name[0]?.toUpperCase()}</div>
                <span style={{color:"rgba(255,255,255,0.85)",fontSize:13,fontWeight:700,fontFamily:"'Amiri',serif"}}>{r.name}</span>
              </div>
              <StarDisplay rating={r.rating} size={12}/>
            </div>
            <p style={{color:"rgba(255,255,255,0.6)",fontSize:12,fontFamily:"'Amiri',serif",lineHeight:1.7}}>{r.comment}</p>
            <p style={{color:"rgba(255,255,255,0.2)",fontSize:10,marginTop:4}}>{new Date(r.date).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── COUNTDOWN BANNER ──────────────────────────────────────────
function CountdownBanner({endDate, title, subtitle, mob, lang, onShop}){
  const calc=()=>{
    const diff=new Date(endDate)-new Date();
    if(diff<=0)return null;
    return{
      d:Math.floor(diff/86400000),
      h:Math.floor((diff%86400000)/3600000),
      m:Math.floor((diff%3600000)/60000),
      s:Math.floor((diff%60000)/1000)
    };
  };
  const [time,setTime]=useState(calc());
  useEffect(()=>{const t=setInterval(()=>setTime(calc()),1000);return()=>clearInterval(t);},[endDate]);
  if(!time)return null;

  const labels={
    ar:["يوم","ساعة","دقيقة","ثانية"],
    fr:["J","H","Min","Sec"],
    en:["Days","Hrs","Min","Sec"]
  }[lang||"ar"];

  return(
    <div style={{background:`linear-gradient(135deg,#0d0d0d 0%,#1a0d05 50%,#0d0d0d 100%)`,padding:mob?"28px 16px":"44px 44px",textAlign:"center",position:"relative",overflow:"hidden",borderTop:"1px solid rgba(201,169,110,0.1)",borderBottom:"1px solid rgba(201,169,110,0.1)"}}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center,rgba(201,169,110,0.07) 0%,transparent 65%)",pointerEvents:"none"}}/>
      {/* Animated border top */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,#C9A96E,#f5e199,#C9A96E,transparent)`}}/>

      <p style={{color:"#C9A96E",fontSize:mob?10:12,letterSpacing:"0.3em",fontFamily:"'Amiri',serif",fontWeight:700,marginBottom:8,textTransform:"uppercase"}}>⚡ {lang==="ar"?"عرض محدود":lang==="fr"?"OFFRE LIMITÉE":"LIMITED OFFER"} ⚡</p>
      <h3 style={{color:"#fff",fontSize:mob?18:26,fontWeight:700,fontFamily:"'Amiri',serif",marginBottom:6}}>{title}</h3>
      {subtitle&&<p style={{color:"rgba(255,255,255,0.45)",fontSize:mob?12:14,fontFamily:"'Amiri',serif",marginBottom:20}}>{subtitle}</p>}

      <div style={{display:"flex",justifyContent:"center",gap:mob?10:18,marginBottom:24}}>
        {[[time.d,labels[0]],[time.h,labels[1]],[time.m,labels[2]],[time.s,labels[3]]].map(([val,lbl],i)=>(
          <div key={i} className="countdown-digit" style={{minWidth:mob?48:60}}>
            <span className="countdown-num" style={{fontSize:mob?22:30}}>{String(val).padStart(2,"0")}</span>
            <span className="countdown-label">{lbl}</span>
          </div>
        ))}
      </div>
      <button onClick={onShop} style={{background:"linear-gradient(135deg,#C9A96E,#8b5e3c)",color:"#fff",border:"none",borderRadius:50,padding:mob?"11px 32px":"14px 52px",fontSize:mob?13:15,fontWeight:700,fontFamily:"'Amiri',serif",letterSpacing:"0.08em",cursor:"pointer",boxShadow:"0 6px 24px rgba(201,169,110,0.35)"}}>
        {lang==="ar"?"تسوقي الآن ←":lang==="fr"?"Acheter →":"Shop Now →"}
      </button>
    </div>
  );
}

// ── INSTAGRAM GALLERY ─────────────────────────────────────────
function InstagramGallery({products, mob, night, lang, onOpenPopup, instagram}){
  const picks=products.filter(p=>p.images&&p.images[0]).slice(0,6);
  if(picks.length<3)return null;
  const BG=night?"#0d0d0d":"#faf8f5";
  const TEXT=night?"#f0ebe4":"#0d0d0d";
  const BORDER=night?"rgba(201,169,110,0.2)":"rgba(201,169,110,0.18)";

  return(
    <div style={{padding:mob?"40px 16px":"72px 44px",background:BG}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <p style={{fontSize:11,letterSpacing:"0.3em",color:"#C9A96E",fontWeight:700,fontFamily:"'Amiri',serif",marginBottom:10,textTransform:"uppercase"}}>✦ &nbsp;{lang==="ar"?"معرض الصور":lang==="fr"?"Galerie":"Gallery"}&nbsp; ✦</p>
        <h2 style={{fontSize:mob?24:34,fontWeight:700,fontFamily:"'Amiri',serif",color:TEXT,marginBottom:10}}>
          {lang==="ar"?"استوحي إطلالتك":lang==="fr"?"Inspirez-vous":"Get Inspired"}
        </h2>
        <div style={{display:"flex",alignItems:"center",gap:10,maxWidth:260,margin:"0 auto 18px"}}>
          <div style={{flex:1,height:1,background:`linear-gradient(to right,transparent,#C9A96E)`}}/>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" strokeLinecap="round"/></svg>
          <div style={{flex:1,height:1,background:`linear-gradient(to left,transparent,#C9A96E)`}}/>
        </div>
        {instagram&&(
          <a href={instagram.startsWith("http")?instagram:`https://instagram.com/${instagram.replace("@","")}`}
            target="_blank" rel="noreferrer"
            style={{display:"inline-flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",color:"#fff",border:"none",borderRadius:50,padding:"9px 22px",fontSize:13,fontWeight:700,fontFamily:"'Amiri',serif",textDecoration:"none",boxShadow:"0 4px 18px rgba(131,58,180,0.35)",letterSpacing:"0.05em"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" strokeLinecap="round"/></svg>
            {instagram.startsWith("http")?lang==="ar"?"تابعنا على إنستغرام":lang==="fr"?"Suivez-nous":"Follow us":`@${instagram.replace("@","")}`}
          </a>
        )}
      </div>

      {/* Mosaic grid */}
      <div style={{display:"grid",gridTemplateColumns:mob?"repeat(3,1fr)":"repeat(6,1fr)",gridTemplateRows:mob?"repeat(2,140px)":"repeat(2,220px)",gap:mob?6:10,maxWidth:1100,margin:"0 auto"}}>
        {picks.map((p,i)=>{
          const isLarge=i===0||i===3;
          return(
            <div key={p.id} className="ig-thumb"
              style={{gridColumn:isLarge&&!mob?`span 2`:"span 1",gridRow:isLarge&&!mob?"span 2":"span 1",border:`1px solid ${BORDER}`,borderRadius:mob?10:16}}
              onClick={()=>onOpenPopup(p)}>
              <img src={p.images[0]} alt={p.name}/>
              <div className="ig-overlay">
                <div className="ig-icon" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" strokeLinecap="round"/></svg>
                  <span style={{fontSize:11,fontFamily:"'Amiri',serif",letterSpacing:"0.1em"}}>{p.name}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductCard({product,t,onAdd,onOpenPopup,categories,night,notify}) {
  const [hov,setHov]=useState(false);
  const [selSize,setSelSize]=useState("");
  const [liked,setLiked]=useState(()=>{try{return JSON.parse(localStorage.getItem("wish_"+product.id)||"false");}catch{return false;}});
  const [tilt,setTilt]=useState({x:0,y:0,shine:0,shineX:50,shineY:50});
  const cardRef=useRef(null);
  const [heartAnim,setHeartAnim]=useState(false);
  const [cartAnim,setCartAnim]=useState(false);
  const mob=useIsMobile();
  const img=(product.images&&product.images[0])||product.image;
  const catObj=categories.find(c=>c.name===product.category);
  const catIcon=catObj?catObj.icon:"";
  const isNew=product.newUntil&&new Date(product.newUntil)>new Date();
  const displayBadge=isNew?"جديد":product.badge||"";
  const CARD_BG=night?"#1a1a1a":"#fff";
  const TEXT=night?"#f0ebe4":"#0d0d0d";
  const hasSizes=product.sizes&&product.sizes.length>0;
  const canAdd=!hasSizes||selSize;

  // 3D tilt on mouse move (desktop)
  const handleMouseMove=e=>{
    if(mob)return;
    const card=cardRef.current;
    if(!card)return;
    const rect=card.getBoundingClientRect();
    const cx=(e.clientX-rect.left)/rect.width;
    const cy=(e.clientY-rect.top)/rect.height;
    setTilt({
      x:(cy-0.5)*16,
      y:(cx-0.5)*-16,
      shine:0.18,
      shineX:cx*100,
      shineY:cy*100
    });
  };
  const handleMouseLeave=()=>{
    setHov(false);
    setTilt({x:0,y:0,shine:0,shineX:50,shineY:50});
  };

  // Gyroscope tilt (mobile)
  useEffect(()=>{
    if(!mob)return;
    const handler=e=>{
      const x=Math.max(-12,Math.min(12,(e.gamma||0)*0.4));
      const y=Math.max(-12,Math.min(12,(e.beta-45||0)*0.3));
      setTilt(t=>({...t,x:y,y:-x,shine:0.08,shineX:50+x*2,shineY:50+y*2}));
    };
    window.addEventListener("deviceorientation",handler,true);
    return()=>window.removeEventListener("deviceorientation",handler,true);
  },[mob]);

  return (
    <div
      ref={cardRef}
      className="card"
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{
        background:CARD_BG,
        borderRadius:22,
        overflow:"hidden",
        boxShadow:hov
          ?`0 28px 56px rgba(0,0,0,${night?0.5:0.18}),0 0 0 1px rgba(201,169,110,0.25)`
          :night?"0 6px 24px rgba(0,0,0,0.3)":"0 6px 24px rgba(0,0,0,0.07)",
        transition:"box-shadow .4s,background .5s",
        transform:`perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hov&&!mob?1.03:1})`,
        transitionProperty:"transform,box-shadow,background",
        transitionDuration:hov?"0.08s":"0.5s",
        willChange:"transform",
        position:"relative"
      }}>
      {/* Shine overlay */}
      <div style={{
        position:"absolute",inset:0,zIndex:3,pointerEvents:"none",borderRadius:22,
        background:`radial-gradient(circle at ${tilt.shineX}% ${tilt.shineY}%, rgba(255,255,255,${tilt.shine}) 0%, transparent 65%)`,
        transition:hov?"none":"opacity .5s",
        opacity:hov||mob?1:0
      }}/>
      <div style={{position:"relative",overflow:"hidden",cursor:"pointer",height:mob?170:275}} onClick={()=>onOpenPopup(product)}>
        <img src={img} alt={product.name} className="cimg" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(13,13,13,0.65) 0%,transparent 55%)"}}/>
        {displayBadge&&<span style={{position:"absolute",top:13,left:13,background:displayBadge==="تخفيض"?"#c0392b":displayBadge==="جديد"?`linear-gradient(135deg,#27ae60,#1e8449)`:`linear-gradient(135deg,${G},#8b5e3c)`,color:"#fff",padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700,letterSpacing:"0.06em",boxShadow:"0 2px 10px rgba(0,0,0,0.25)"}}>{displayBadge}</span>}
        {product.stock===0&&<span style={{position:"absolute",bottom:13,left:13,background:"rgba(0,0,0,0.75)",color:"#fff",padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700}}>نفد المخزون</span>}
        {product.stock>0&&product.stock<=5&&<span style={{position:"absolute",bottom:13,left:13,background:"rgba(231,76,60,0.85)",color:"#fff",padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700}}>آخر {product.stock} قطع</span>}
        {hov&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.22)"}}>
          <span className="card-overlay-btn" style={{background:"rgba(255,255,255,0.95)",color:DARK,padding:"9px 22px",borderRadius:20,fontWeight:700,fontSize:13,fontFamily:"'Amiri',serif",boxShadow:"0 4px 20px rgba(0,0,0,0.2)",display:"flex",alignItems:"center",gap:7}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            {t.dir==="rtl"?"عرض التفاصيل":"View Details"}
          </span>
        </div>}
      </div>
      <div style={{padding:mob?"10px 11px 12px":"15px 17px 18px"}}>
        <p style={{fontSize:mob?10:11,color:G,fontWeight:700,marginBottom:mob?3:5,letterSpacing:"0.1em"}}>{catIcon&&<span style={{marginLeft:4}}>{catIcon}</span>}{catObj?catObj.name:product.category}</p>
        <h3 style={{fontWeight:700,fontSize:mob?12:15,marginBottom:hasSizes?6:mob?8:13,fontFamily:"'Amiri',serif",lineHeight:1.3,color:TEXT,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{product.name}</h3>
        {hasSizes&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:7}}>
          {product.sizes.map(s=><button key={s} onClick={(e)=>{e.stopPropagation();setSelSize(s);}} style={{padding:mob?"2px 7px":"3px 9px",borderRadius:12,border:`1.5px solid ${selSize===s?G:"#ddd"}`,background:selSize===s?G:"transparent",color:selSize===s?"#fff":TEXT,fontWeight:700,fontSize:mob?10:11,cursor:"pointer",transition:"all .2s"}}>{s}</button>)}
        </div>}

        {mob?(
          /* MOBILE: stack vertically */
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{fontSize:15,fontWeight:700,fontFamily:"'Cinzel Decorative',serif",color:TEXT}}>{product.price} <span style={{fontSize:9,color:"#aaa"}}>DH</span></span>
                  {product.discount&&<span style={{fontSize:9,background:"#e74c3c",color:"#fff",borderRadius:5,padding:"1px 4px",flexShrink:0}}>-{product.discount}%</span>}
                </div>
                {product.originalPrice&&<span style={{fontSize:9,color:"#bbb",textDecoration:"line-through"}}>{product.originalPrice} DH</span>}
              </div>
              <button onClick={(e)=>{e.stopPropagation();const n=!liked;setLiked(n);setHeartAnim(true);setTimeout(()=>setHeartAnim(false),400);try{localStorage.setItem("wish_"+product.id,JSON.stringify(n));}catch{}}} style={{background:"none",border:"none",cursor:"pointer",padding:3,flexShrink:0,animation:heartAnim?"heartPop .4s ease":"none"}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={liked?"#e74c3c":"none"} stroke={liked?"#e74c3c":"#bbb"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </button>
            </div>
            <button className="btn-dark" onClick={(e)=>{e.stopPropagation();if(!canAdd){notify("⚠️ "+(t.dir==="rtl"?"اختار المقاس أولاً":"Choose a size first"));return;}setCartAnim(true);setTimeout(()=>setCartAnim(false),400);onAdd({...product,size:selSize});}} style={{width:"100%",padding:"8px 6px",borderRadius:10,fontSize:11,opacity:hasSizes&&!selSize?0.6:1,textAlign:"center",animation:cartAnim?"cartBounce .4s ease":"none"}}>+ {t.addToCart}</button>
          </div>
        ):(
          /* DESKTOP: side by side */
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
            <div style={{display:"flex",flexDirection:"column",gap:3,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:21,fontWeight:700,fontFamily:"'Cinzel Decorative',serif",color:TEXT,whiteSpace:"nowrap"}}>{product.price} <span style={{fontSize:11,color:"#aaa"}}>DH</span></span>
                {product.discount&&<span style={{fontSize:11,background:"#e74c3c",color:"#fff",borderRadius:6,padding:"2px 6px",flexShrink:0}}>-{product.discount}%</span>}
              </div>
              {product.originalPrice&&<span style={{fontSize:11,color:"#bbb",textDecoration:"line-through"}}>{product.originalPrice} DH</span>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <button onClick={(e)=>{e.stopPropagation();const n=!liked;setLiked(n);setHeartAnim(true);setTimeout(()=>setHeartAnim(false),400);try{localStorage.setItem("wish_"+product.id,JSON.stringify(n));}catch{}}} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",alignItems:"center",animation:heartAnim?"heartPop .4s ease":"none"}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill={liked?"#e74c3c":"none"} stroke={liked?"#e74c3c":"#bbb"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </button>
              <button className="btn-dark" onClick={(e)=>{e.stopPropagation();if(!canAdd){notify("⚠️ "+(t.dir==="rtl"?"اختار المقاس أولاً":"Choose a size first"));return;}setCartAnim(true);setTimeout(()=>setCartAnim(false),400);onAdd({...product,size:selSize});}} style={{padding:"9px 12px",borderRadius:11,fontSize:12,flexShrink:0,whiteSpace:"nowrap",opacity:hasSizes&&!selSize?0.6:1,animation:cartAnim?"cartBounce .4s ease":"none"}}>+ {t.addToCart}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HeroText({lang,G,mob}){
  const texts=lang==="ar"?["فاخر. أصيل. مغربي.","جودة لا مثيل لها","عباياتنا تتكلم"]:lang==="fr"?["Luxueux. Authentique. Marocain.","Qualité sans égale","L'élégance marocaine"]:["Luxury. Authentic. Moroccan.","Unmatched Quality","Moroccan Elegance"];
  const typed=useTypewriter(texts);
  return <span style={{fontSize:mob?12:14,color:G,whiteSpace:"nowrap",fontStyle:"italic",fontFamily:"'Amiri',serif",letterSpacing:lang==="ar"?"0.02em":"0.14em"}}>
    {typed}<span style={{animation:"typewriterBlink 1s step-end infinite",color:G}}>|</span>
  </span>;
}

function HeroContent({mob,G,lang,t,setPage}){
  const parallax=useParallax(0.18);
  return <div style={{position:"relative",zIndex:1,maxWidth:820,width:"100%",padding:"0 10px",transform:`translateY(${parallax}px)`}}>
    <div className="anim-fadeup" style={{marginBottom:28}}>
      <div dir="ltr" style={{fontFamily:"'Cinzel Decorative',Georgia,serif",fontSize:mob?"clamp(38px,14vw,64px)":"clamp(64px,10vw,140px)",fontWeight:900,letterSpacing:mob?"0.1em":"0.18em",display:"flex",justifyContent:"center",lineHeight:1}}>
        <span style={{color:"#fff"}}>Y</span>
        <span style={{color:G}}>L</span>
        <span style={{color:"#fff"}}>A</span>
        <span style={{color:G}}>A</span>
        <span style={{color:"#fff"}}>F</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,margin:"10px auto 0",maxWidth:420,justifyContent:"center"}}>
        <div style={{flex:1,height:1,background:`linear-gradient(to right,transparent,${G})`}}/>
        <HeroText lang={lang} G={G} mob={mob}/>
        <div style={{flex:1,height:1,background:`linear-gradient(to left,transparent,${G})`}}/>
      </div>
    </div>
    <button className="anim-fadeup-2 btn-gold" onClick={()=>setPage("shop")} style={{padding:mob?"12px 36px":"17px 62px",borderRadius:50,fontSize:mob?14:17,letterSpacing:"0.09em"}}>
      {t.explore} ←
    </button>
  </div>;
}

export default function YLAAFStore() {
  const [products,setProducts]=useState([]);
  const [orders,setOrders]=useState([]);
  const [categories,setCategories]=useState([]);
  const [banner,setBanner]=useState({title:"",videoUrl:""});
  const [countdown,setCountdown]=useState({active:false,title:"",subtitle:"",endDate:""});
  const [siteSettings,setSiteSettings]=useState({whatsapp:"212703225198",instagram:""});
  const [subscribers,setSubscribers]=useState([]);
  const [notifBellOpen,setNotifBellOpen]=useState(false);
  const [bellPhone,setBellPhone]=useState("");
  const [loading,setLoading]=useState(true);
  const [lang,setLang]=useState("en");
  const [page,setPage]=useState("home");
  const [cart,setCart]=useState([]);
  const [cartOpen,setCartOpen]=useState(false);
  const [notif,setNotif]=useState("");
  const [orderDone,setOrderDone]=useState(false);
  const [activeCat,setActiveCat]=useState("all");
  const [adminOpen,setAdminOpen]=useState(false);
  const [adminOK,setAdminOK]=useState(false);
  const [adminPass,setAdminPass]=useState("");
  const [passErr,setPassErr]=useState(false);
  const [logoClicks,setLogoClicks]=useState(0);
  const logoClickTimer=useRef(null);
  const [orderForm,setOrderForm]=useState({name:"",phone:"",address:""});
  const [newProd,setNewProd]=useState({name:"",price:"",category:"",images:[],badge:"",discount:0,categoryIcon:"",newDays:0,sizes:[],stock:""});
  const [newCat,setNewCat]=useState({name:"",icon:""});
  const [adminTab,setAdminTab]=useState("products");
  const [popup,setPopup]=useState(null);
  const [menuOpen,setMenuOpen]=useState(false);
  const [search,setSearch]=useState("");
  const [searchOpen,setSearchOpen]=useState(false);
  const [wishPage,setWishPage]=useState(false);

  const mob=useIsMobile();
  const [night,toggleNight]=useNightMode();
  const BG=night?"#0d0d0d":"#faf8f5";
  const TEXT=night?"#f0ebe4":"#0d0d0d";
  const CARD_BG=night?"#1a1a1a":"#fff";
  const NAV_BG=night?"rgba(13,13,13,0.96)":"rgba(250,248,245,0.96)";
  const BORDER=night?"rgba(201,169,110,0.2)":"rgba(201,169,110,0.18)";
  const t=translations[lang];

  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"categories"),(snap)=>{
      setCategories(snap.docs.map(d=>({...d.data(),id:d.id})));
    });
    return()=>unsub();
  },[]);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    if(params.get("order")==="success"){
      setOrderDone(true);
      window.history.replaceState({},"",window.location.pathname);
      setTimeout(()=>setOrderDone(false),6000);
    }
  },[]);

  useEffect(()=>{
    const unsub=onSnapshot(doc(db,"settings","banner"),(snap)=>{
      if(snap.exists())setBanner(snap.data());
    });
    return()=>unsub();
  },[]);

  useEffect(()=>{
    const unsub=onSnapshot(doc(db,"settings","countdown"),(snap)=>{
      if(snap.exists())setCountdown(snap.data());
    });
    return()=>unsub();
  },[]);

  useEffect(()=>{
    const unsub=onSnapshot(doc(db,"settings","siteSettings"),(snap)=>{
      if(snap.exists())setSiteSettings(s=>({...s,...snap.data()}));
    });
    return()=>unsub();
  },[]);

  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"subscribers"),(snap)=>{
      setSubscribers(snap.docs.map(d=>({...d.data(),id:d.id})));
    });
    return()=>unsub();
  },[]);

  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"products"),async(snap)=>{
      if(snap.empty){for(const p of defaultProducts)await setDoc(doc(db,"products",p.id),p);}
      else setProducts(snap.docs.map(d=>({...d.data(),id:d.id})));
      setLoading(false);
    });
    return()=>unsub();
  },[]);

  useEffect(()=>{
    const q=query(collection(db,"orders"),orderBy("date","desc"));
    const unsub=onSnapshot(q,(snap)=>{setOrders(snap.docs.map(d=>({...d.data(),id:d.id})));});
    return()=>unsub();
  },[]);


  const notify=(msg)=>{setNotif(msg);setTimeout(()=>setNotif(""),3000);};

  const addToCart=(p)=>{
    const key=p.id+(p.size||"");
    setCart(prev=>{const e=prev.find(i=>i.id===p.id&&i.size===p.size);return e?prev.map(i=>(i.id===p.id&&i.size===p.size)?{...i,qty:i.qty+1}:i):[...prev,{...p,qty:1,cartKey:key}];});
    notify("✅ "+(lang==="ar"?"أضيف للسلة":lang==="fr"?"Ajouté":"Added")+(p.size?` (${p.size})`:""));
  };
  const removeFromCart=(id,size)=>setCart(prev=>prev.filter(i=>!(i.id===id&&i.size===size)));
  const updateQty=(id,size,d)=>setCart(prev=>prev.map(i=>(i.id===id&&i.size===size)?{...i,qty:Math.max(1,i.qty+d)}:i));
  const totalItems=cart.reduce((a,i)=>a+i.qty,0);
  const totalPrice=cart.reduce((a,i)=>a+i.price*i.qty,0);

  const handleImages=async(e)=>{
    const files=Array.from(e.target.files);notify("⏳ جاري رفع الصور...");
    const urls=await Promise.all(files.map(async(file)=>{
      const fd=new FormData();fd.append("file",file);fd.append("upload_preset","r3uemf9r");fd.append("cloud_name","dcg34jeuy");
      const res=await fetch("https://api.cloudinary.com/v1_1/dcg34jeuy/image/upload",{method:"POST",body:fd});
      const data=await res.json();return data.secure_url;
    }));
    setNewProd(p=>({...p,images:[...p.images,...urls]}));notify("✅ تم رفع الصور!");
  };

  const addProduct=async()=>{
    if(!newProd.name||!newProd.price||!newProd.images.length)return;
    const id=Date.now().toString();
    const basePrice=parseInt(newProd.price);
    const disc=parseInt(newProd.discount)||0;
    const finalPrice=disc>0?Math.round(basePrice*(1-disc/100)):basePrice;
    const days=parseInt(newProd.newDays)||0;
    const newUntil=days>0?new Date(Date.now()+days*24*60*60*1000).toISOString():null;
    await setDoc(doc(db,"products",id),{id,name:newProd.name,price:finalPrice,originalPrice:disc>0?basePrice:null,discount:disc||null,category:newProd.category||"",categoryIcon:newProd.categoryIcon||"",images:newProd.images,badge:newProd.badge||"",newUntil,sizes:newProd.sizes||[],stock:newProd.stock!==""?parseInt(newProd.stock):null});
    setNewProd({name:"",price:"",category:"",images:[],badge:"",discount:0,categoryIcon:"",newDays:0,sizes:[],stock:""});notify("✅ تمت الإضافة!");
  };

  const [editProd,setEditProd]=useState(null);

  const saveEdit=async()=>{
    if(!editProd)return;
    const basePrice=parseInt(editProd.price);
    const disc=parseInt(editProd.discount)||0;
    const finalPrice=disc>0?Math.round(basePrice*(1-disc/100)):basePrice;
    const days=parseInt(editProd.newDays)||0;
    const newUntil=days>0?new Date(Date.now()+days*24*60*60*1000).toISOString():editProd.newUntil||null;
    await setDoc(doc(db,"products",editProd.id),{...editProd,price:finalPrice,originalPrice:disc>0?basePrice:null,discount:disc||null,newUntil,sizes:editProd.sizes||[],stock:editProd.stock!==""&&editProd.stock!=null?parseInt(editProd.stock):null});
    setEditProd(null);notify("✅ "+(lang==="ar"?"تم التعديل!":"Saved!"));
  };

  const addCategory=async()=>{
    if(!newCat.name)return;
    const id=Date.now().toString();
    await setDoc(doc(db,"categories",id),{id,name:newCat.name,icon:newCat.icon||""});
    setNewCat({name:"",icon:""});notify("✅ تمت إضافة الكاتيغوري!");
  };
  const deleteCategory=async(id)=>await deleteDoc(doc(db,"categories",id));

  const deleteProduct=async(id)=>await deleteDoc(doc(db,"products",id.toString()));

  const sendOrder=()=>{
    if(!orderForm.name||!orderForm.phone)return null;
    const lines=cart.map(i=>`${i.name}${i.size?` (${i.size})`:""} x${i.qty} = ${i.price*i.qty} DH`).join("\n");
    const returnUrl=`${window.location.origin}${window.location.pathname}?order=success`;
    const msg=`🛍️ طلب جديد - YLAAF\n\nالاسم: ${orderForm.name}\nالهاتف: ${orderForm.phone}\nالعنوان: ${orderForm.address}\n\n${lines}\n\nالمجموع: ${totalPrice} DH\n\n✅ رابط تأكيد الطلب: ${returnUrl}`;
    return encodeURIComponent(msg);
  };

  const handleOrder=async()=>{
    if(!orderForm.name||!orderForm.phone){notify("⚠️ "+(t.dir==="rtl"?"أدخل اسمك ورقم هاتفك":"Enter your name and phone"));return;}
    // Save to Firebase in background
    addDoc(collection(db,"orders"),{...orderForm,items:[...cart],total:totalPrice,date:new Date().toISOString()}).catch(()=>{});
    notify(t.orderSuccess);
    setCart([]);setCartOpen(false);setOrderForm({name:"",phone:"",address:""});
  };

  const filtered=(activeCat==="all"?products:products.filter(p=>p.category===activeCat))
    .filter(p=>!search||p.name.toLowerCase().includes(search.toLowerCase())||p.category.toLowerCase().includes(search.toLowerCase()));
  const wishlist=products.filter(p=>{try{return JSON.parse(localStorage.getItem("wish_"+p.id)||"false");}catch{return false;}});

  if(loading) return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#080808",overflow:"hidden",position:"relative"}}>
      {/* Deep radial glow */}
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center,rgba(201,169,110,0.12) 0%,transparent 60%)"}}/>
      {/* Animated rings */}
      {[340,240,160,90].map((s,i)=>(
        <div key={i} style={{position:"absolute",top:"50%",left:"50%",width:s,height:s,borderRadius:"50%",border:`1px solid rgba(201,169,110,${0.06+i*0.03})`,transform:"translate(-50%,-50%)",animation:`ringPulse ${2.5+i*0.7}s ${i*0.4}s ease-out infinite`}}/>
      ))}
      {/* Spinning arc */}
      <div style={{position:"absolute",top:"50%",left:"50%",width:200,height:200,borderRadius:"50%",border:"2px solid transparent",borderTopColor:G,borderRightColor:"rgba(201,169,110,0.3)",transform:"translate(-50%,-50%)",animation:"spinSlow 2s linear infinite"}}/>
      {/* Floating gold particles */}
      {[...Array(12)].map((_,i)=>(
        <div key={i} style={{position:"absolute",bottom:"45%",left:`${30+i*4}%`,width:3,height:3,borderRadius:"50%",background:G,opacity:0,animation:`particleFloat ${2+Math.random()*2}s ${i*0.2}s ease-out infinite`,"--dx":`${(i%2===0?1:-1)*(10+i*5)}px`}}/>
      ))}
      {/* Logo */}
      <div style={{position:"relative",zIndex:1,textAlign:"center"}}>
        <div style={{animation:"fadeUp 0.9s ease forwards"}}>
          <div dir="ltr" style={{fontFamily:"'Cinzel Decorative',serif",fontSize:58,fontWeight:900,letterSpacing:"0.22em",marginBottom:4,animation:"logoGlow 2.5s ease infinite"}}>
            <span style={{color:"#fff"}}>Y</span><span style={{color:G}}>L</span><span style={{color:"#fff"}}>A</span><span style={{color:G}}>A</span><span style={{color:"#fff"}}>F</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:28,justifyContent:"center"}}>
            <div style={{width:60,height:1,background:`linear-gradient(to right,transparent,${G})`}}/>
            <span style={{fontSize:11,color:G,fontStyle:"italic",fontFamily:"'Amiri',serif",letterSpacing:"0.18em"}}>فاخر · أصيل · مغربي</span>
            <div style={{width:60,height:1,background:`linear-gradient(to left,transparent,${G})`}}/>
          </div>
        </div>
        {/* Progress dots */}
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:18}}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{width:6,height:6,borderRadius:"50%",background:G,opacity:0.3,animation:`pulse 1.4s ${i*0.2}s ease infinite`}}/>
          ))}
        </div>
        <div style={{width:160,background:"rgba(255,255,255,0.05)",borderRadius:4,overflow:"hidden",margin:"0 auto"}}>
          <div className="load-bar" style={{height:3}}/>
        </div>
      </div>
    </div>
  );

  return (
    <div dir={t.dir} style={{fontFamily:"'Amiri',Georgia,serif",background:BG,minHeight:"100vh",color:TEXT,paddingTop:68,transition:"background .5s,color .5s"}}>
      <style>{CSS}</style>

      {notif&&<div style={{position:"fixed",top:24,left:"50%",zIndex:9999,display:"flex",alignItems:"center",gap:10,background:notif.startsWith("✅")?"linear-gradient(135deg,#1a3a2a,#0d2a1a)":notif.startsWith("❌")?"linear-gradient(135deg,#3a1a1a,#2a0d0d)":"linear-gradient(135deg,#1a1a2a,#0d0d1a)",color:"#fff",padding:"13px 24px",borderRadius:50,fontWeight:700,boxShadow:"0 8px 40px rgba(0,0,0,0.4)",fontSize:14,whiteSpace:"nowrap",border:`1px solid ${notif.startsWith("✅")?"rgba(39,174,96,0.4)":notif.startsWith("❌")?"rgba(231,76,60,0.4)":`rgba(201,169,110,0.4)`}`,animation:"toastIn .35s cubic-bezier(.22,.68,0,1.2)"}}>
        <span style={{fontSize:16}}>{notif.split(" ")[0]}</span>
        <span>{notif.split(" ").slice(1).join(" ")}</span>
      </div>}
      {/* EDIT MODAL */}
      {editProd&&<div style={{position:"fixed",inset:0,zIndex:4000,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div onClick={()=>setEditProd(null)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.7)"}}/>
        <div style={{position:"relative",background:CARD_BG,borderRadius:20,padding:24,width:mob?"95vw":"min(540px,95vw)",maxHeight:"90vh",overflowY:"auto",animation:"scaleIn .3s ease",zIndex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
            <h3 style={{fontWeight:700,fontSize:16,fontFamily:"'Amiri',serif",color:TEXT}}>✏️ {lang==="ar"?"تعديل المنتج":"Edit Product"}</h3>
            <button onClick={()=>setEditProd(null)} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:TEXT}}>✕</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><label style={{display:"block",fontSize:11,fontWeight:700,color:"#888",marginBottom:4}}>{lang==="ar"?"الاسم":"Name"}</label><input value={editProd.name} onChange={e=>setEditProd(p=>({...p,name:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,border:"1.5px solid #e0d6cc",fontSize:13,outline:"none"}}/></div>
            <div><label style={{display:"block",fontSize:11,fontWeight:700,color:"#888",marginBottom:4}}>{lang==="ar"?"السعر":"Price"}</label><input value={editProd.price} onChange={e=>setEditProd(p=>({...p,price:e.target.value}))} type="number" style={{width:"100%",padding:"9px 12px",borderRadius:9,border:"1.5px solid #e0d6cc",fontSize:13,outline:"none"}}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><label style={{display:"block",fontSize:11,fontWeight:700,color:"#888",marginBottom:4}}>{lang==="ar"?"التخفيض %":"Discount %"}</label><input value={editProd.discount} onChange={e=>setEditProd(p=>({...p,discount:e.target.value}))} type="number" min="0" max="90" style={{width:"100%",padding:"9px 12px",borderRadius:9,border:"1.5px solid #e0d6cc",fontSize:13,outline:"none"}}/></div>
            <div><label style={{display:"block",fontSize:11,fontWeight:700,color:"#888",marginBottom:4}}>Badge</label><input value={editProd.badge||""} onChange={e=>setEditProd(p=>({...p,badge:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,border:"1.5px solid #e0d6cc",fontSize:13,outline:"none"}}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><label style={{display:"block",fontSize:11,fontWeight:700,color:"#888",marginBottom:4}}>{lang==="ar"?"الكمية في المخزون":"Stock"}</label><input value={editProd.stock||""} onChange={e=>setEditProd(p=>({...p,stock:e.target.value}))} type="number" min="0" placeholder={lang==="ar"?"فارغ = غير محدود":"-"} style={{width:"100%",padding:"9px 12px",borderRadius:9,border:"1.5px solid #e0d6cc",fontSize:13,outline:"none"}}/></div>
            <div><label style={{display:"block",fontSize:11,fontWeight:700,color:"#888",marginBottom:4}}>{lang==="ar"?"الكاتيغوري":"Category"}</label>
              <select value={editProd.category} onChange={e=>setEditProd(p=>({...p,category:e.target.value}))} style={{width:"100%",padding:"9px 12px",borderRadius:9,border:"1.5px solid #e0d6cc",fontSize:13,outline:"none",background:CARD_BG,color:TEXT}}>
                {categories.map(c=><option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#888",marginBottom:6}}>{lang==="ar"?"المقاسات":"Sizes"}</label>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {["XS","S","M","L","XL","XXL"].map(s=>{
                const sel=(editProd.sizes||[]).includes(s);
                return <button key={s} type="button" onClick={()=>setEditProd(p=>({...p,sizes:sel?(p.sizes||[]).filter(x=>x!==s):[...(p.sizes||[]),s]}))} style={{padding:"5px 13px",borderRadius:18,border:`2px solid ${sel?G:"#e0d6cc"}`,background:sel?G:"transparent",color:sel?"#fff":"#888",fontWeight:700,fontSize:12,cursor:"pointer"}}>{s}</button>;
              })}
            </div>
          </div>
          {editProd.discount>0&&editProd.price&&<p style={{color:G,fontSize:12,marginBottom:10,fontFamily:"'Amiri',serif"}}>💰 {lang==="ar"?"بعد التخفيض":"After discount"}: {Math.round(parseInt(editProd.price)*(1-parseInt(editProd.discount)/100))} DH</p>}
          
          {/* IMAGES */}
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#888",marginBottom:8}}>{lang==="ar"?"الصور":"Images"}</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
              {(editProd.images||[]).map((img,i)=>(
                <div key={i} style={{position:"relative"}}>
                  <img src={img} alt="" style={{width:72,height:72,borderRadius:10,objectFit:"cover",border:`2px solid ${G}`}}/>
                  <button onClick={()=>setEditProd(p=>({...p,images:p.images.filter((_,j)=>j!==i)}))} style={{position:"absolute",top:-6,right:-6,background:"#e74c3c",color:"#fff",border:"none",borderRadius:"50%",width:20,height:20,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>×</button>
                </div>
              ))}
            </div>
            <input type="file" accept="image/*" multiple onChange={async(e)=>{
              const files=Array.from(e.target.files);
              notify("⏳ "+(lang==="ar"?"جاري الرفع...":"Uploading..."));
              const urls=await Promise.all(files.map(async(file)=>{
                const fd=new FormData();fd.append("file",file);fd.append("upload_preset","r3uemf9r");fd.append("cloud_name","dcg34jeuy");
                const res=await fetch("https://api.cloudinary.com/v1_1/dcg34jeuy/image/upload",{method:"POST",body:fd});
                const data=await res.json();return data.secure_url;
              }));
              setEditProd(p=>({...p,images:[...(p.images||[]),...urls]}));
              notify("✅ "+(lang==="ar"?"تم رفع الصور!":"Images uploaded!"));
            }} style={{width:"100%",padding:7,borderRadius:9,border:"1.5px solid #e0d6cc",fontSize:12,background:CARD_BG,cursor:"pointer"}}/>
          </div>

          <button className="btn-gold" onClick={saveEdit} style={{width:"100%",padding:"12px",borderRadius:10,fontSize:15}}>💾 {lang==="ar"?"حفظ التعديلات":"Save Changes"}</button>
        </div>
      </div>}

      {popup&&<ProductPopup product={popup} t={t} onAdd={addToCart} onClose={()=>setPopup(null)} notify={notify} db={db} lang={lang}/>}

      {/* NAV */}
      <nav style={{background:NAV_BG,backdropFilter:"blur(14px)",borderBottom:`1px solid ${BORDER}`,padding:mob?"0 16px":"0 44px",display:"flex",alignItems:"center",justifyContent:"space-between",height:68,position:"fixed",top:0,left:0,right:0,zIndex:100,boxShadow:"0 2px 18px rgba(0,0,0,0.08)",transition:"background .5s"}}>
        <div onClick={()=>{
          setPage("home");setMenuOpen(false);
          const next=logoClicks+1;
          setLogoClicks(next);
          if(logoClickTimer.current)clearTimeout(logoClickTimer.current);
          if(next>=5){setAdminOpen(true);setLogoClicks(0);}
          else{logoClickTimer.current=setTimeout(()=>setLogoClicks(0),2000);}
        }} style={{cursor:"pointer"}}><Logo size="sm" inverted={night}/></div>
        {!mob&&(
          <div style={{display:"flex",gap:34,alignItems:"center"}}>
            {["home","shop","bestsellers","about"].map(p=>(
              <span key={p} className="nav-link" onClick={()=>setPage(p)} style={{fontSize:15,color:page===p?G:(night?'#f0ebe4':'#0d0d0d'),borderBottom:page===p?`2px solid ${G}`:"2px solid transparent"}}>
                {p==="home"?t.home:p==="shop"?t.shop:p==="bestsellers"?(
                  <span style={{display:"inline-flex",alignItems:"center",gap:5}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M2 19l2-9 4.5 4L12 5l3.5 9L20 10l2 9H2z"/><circle cx="2" cy="19" r="1.5"/><circle cx="22" cy="19" r="1.5"/><circle cx="12" cy="5" r="1.5"/></svg>
                    {lang==="ar"?"الأكثر مبيعاً":lang==="fr"?"Meilleures ventes":"Best Sellers"}
                  </span>
                ):t.about}
              </span>
            ))}
          </div>
        )}
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {!mob&&["ar","fr","en"].map(l=>(
            <button key={l} onClick={()=>{setLang(l);setActiveCat("all");}} style={{padding:"5px 11px",borderRadius:20,border:`1.5px solid ${lang===l?G:"#ddd"}`,background:lang===l?G:"transparent",color:lang===l?"#fff":"#999",fontWeight:700,fontSize:11,letterSpacing:"0.07em"}}>{l.toUpperCase()}</button>
          ))}
          {/* Search */}
          <button onClick={()=>setSearchOpen(s=>!s)} style={{background:"transparent",border:`1px solid ${BORDER}`,borderRadius:10,padding:"9px 11px",display:"flex",alignItems:"center",cursor:"pointer"}}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
          {/* Wishlist */}
          <button onClick={()=>setWishPage(w=>!w)} style={{background:wishPage?"rgba(231,76,60,0.1)":"transparent",border:`1px solid ${wishPage?"#e74c3c":BORDER}`,borderRadius:10,padding:"9px 11px",display:"flex",alignItems:"center",cursor:"pointer",position:"relative"}}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill={wishPage?"#e74c3c":"none"} stroke={wishPage?"#e74c3c":TEXT} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {wishlist.length>0&&<span style={{position:"absolute",top:-4,right:-4,background:"#e74c3c",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{wishlist.length}</span>}
          </button>
          {/* Notification Bell */}
          <button onClick={()=>setNotifBellOpen(true)} style={{background:"transparent",border:`1px solid ${BORDER}`,borderRadius:10,padding:"9px 11px",display:"flex",alignItems:"center",cursor:"pointer",position:"relative"}}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            {subscribers.length>0&&<span style={{position:"absolute",top:-4,right:-4,background:G,color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{subscribers.length}</span>}
          </button>
          <button className="btn-dark" onClick={()=>setCartOpen(true)} style={{borderRadius:13,padding:mob?"10px 12px":"10px 18px",display:"flex",alignItems:"center",gap:7,fontSize:14}}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            {!mob&&" "+t.cart}
            {totalItems>0&&<span style={{background:G,borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800}}>{totalItems}</span>}
          </button>
          <button onClick={toggleNight} style={{background:night?"rgba(201,169,110,0.15)":"rgba(0,0,0,0.05)",border:`1px solid ${BORDER}`,borderRadius:10,padding:"9px 11px",cursor:"pointer",transition:"all .3s",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {night
              ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            }
          </button>
          {mob&&<button onClick={()=>setMenuOpen(!menuOpen)} style={{background:"transparent",border:`1px solid ${BORDER}`,borderRadius:10,padding:"9px 11px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
            {menuOpen
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>}
        </div>
      </nav>

      {/* SEARCH BAR */}
      {searchOpen&&<div style={{position:"fixed",top:68,left:0,right:0,zIndex:99,background:NAV_BG,backdropFilter:"blur(14px)",borderBottom:`1px solid ${BORDER}`,padding:"12px 24px",animation:"fadeUp .2s ease"}}>
        <div style={{maxWidth:600,margin:"0 auto",display:"flex",alignItems:"center",gap:10}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input autoFocus value={search} onChange={e=>{setSearch(e.target.value);if(page!=="shop")setPage("shop");}} placeholder={lang==="ar"?"ابحث عن منتج...":lang==="fr"?"Rechercher...":"Search products..."} style={{flex:1,border:"none",outline:"none",fontSize:16,background:"transparent",color:TEXT,fontFamily:"'Amiri',serif"}}/>
          {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:"#aaa",fontSize:18}}>×</button>}
        </div>
      </div>}

      {mob&&menuOpen&&(
        <div style={{background:CARD_BG,borderBottom:`1px solid ${BORDER}`,padding:"18px 20px",display:"flex",flexDirection:"column",gap:12,boxShadow:"0 6px 22px rgba(0,0,0,0.07)"}}>
          {["home","shop","bestsellers","about"].map(p=>(
            <span key={p} onClick={()=>{setPage(p);setMenuOpen(false);}} style={{cursor:"pointer",fontSize:18,fontWeight:700,color:page===p?G:(night?'#f0ebe4':'#0d0d0d'),padding:"9px 0",borderBottom:"1px solid #f5f0eb",fontFamily:"'Amiri',serif"}}>
              {p==="home"?t.home:p==="shop"?t.shop:p==="bestsellers"?(
                <span style={{display:"inline-flex",alignItems:"center",gap:6}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2 19l2-9 4.5 4L12 5l3.5 9L20 10l2 9H2z"/><circle cx="2" cy="19" r="1.5"/><circle cx="22" cy="19" r="1.5"/><circle cx="12" cy="5" r="1.5"/></svg>
                  {lang==="ar"?"الأكثر مبيعاً":lang==="fr"?"Meilleures ventes":"Best Sellers"}
                </span>
              ):t.about}
            </span>
          ))}
          <div style={{display:"flex",gap:8,paddingTop:7}}>
            {["ar","fr","en"].map(l=>(
              <button key={l} onClick={()=>{setLang(l);setActiveCat(0);setMenuOpen(false);}} style={{padding:"7px 14px",borderRadius:20,border:`1.5px solid ${lang===l?G:"#ddd"}`,background:lang===l?G:"transparent",color:lang===l?"#fff":"#aaa",fontWeight:700,fontSize:12}}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>
      )}

      {/* HOME */}
      {page==="home"&&<>
        <div style={{background:`linear-gradient(150deg,${DARK} 0%,#1e0f07 50%,#2d1608 100%)`,color:"#fff",padding:mob?"50px 16px 50px":"130px 60px 140px",textAlign:"center",position:"relative",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",minHeight:mob?0:580}}>

          <style>{`
            @keyframes heroFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-18px) scale(1.04)}}
            @keyframes heroPulse{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.15)}}
            @keyframes heroRotate{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(360deg)}}
            @keyframes heroRotateR{from{transform:translate(-50%,-50%) rotate(0deg)}to{transform:translate(-50%,-50%) rotate(-360deg)}}
            @keyframes heroDrift{0%{transform:translateX(-5%) translateY(0) scale(1.1)}50%{transform:translateX(5%) translateY(-3%) scale(1.15)}100%{transform:translateX(-5%) translateY(0) scale(1.1)}}
            @keyframes heroParticle{0%{transform:translateY(100%) translateX(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-100vh) translateX(20px);opacity:0}}
            @keyframes heroShimmer{0%{background-position:200% center}100%{background-position:-200% center}}
            @keyframes heroZoom{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
            @keyframes heroBreathe{0%,100%{box-shadow:0 0 40px rgba(201,169,110,0.2)}50%{box-shadow:0 0 120px rgba(201,169,110,0.5),0 0 200px rgba(201,169,110,0.2)}}
          `}</style>

          {/* HERO BACKGROUND */}
          {banner.heroUrl&&(
            banner.heroUrl.match(/\.(mp4|webm|mov)$/i)
              ? <video src={banner.heroUrl} autoPlay muted loop playsInline style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.38,animation:banner.heroBgAnim==="zoom"?"heroZoom 8s ease-in-out infinite":banner.heroBgAnim==="drift"?"heroDrift 12s ease-in-out infinite":"none"}}/>
              : <img src={banner.heroUrl} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.38,animation:banner.heroBgAnim==="zoom"?"heroZoom 8s ease-in-out infinite":banner.heroBgAnim==="drift"?"heroDrift 12s ease-in-out infinite":"none"}}/>
          )}

          {/* RINGS animation */}
          {banner.heroAnim==="rings"&&<>
            <div style={{position:"absolute",top:"50%",left:"50%",width:mob?300:520,height:mob?300:520,pointerEvents:"none",animation:"heroRotate 20s linear infinite"}}>
              <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"1px solid rgba(201,169,110,0.15)"}}/>
              <div style={{position:"absolute",inset:"18%",borderRadius:"50%",border:"1px dashed rgba(201,169,110,0.1)"}}/>
            </div>
            <div style={{position:"absolute",top:"50%",left:"50%",width:mob?440:740,height:mob?440:740,pointerEvents:"none",animation:"heroRotateR 30s linear infinite"}}>
              <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"1px solid rgba(201,169,110,0.08)"}}/>
            </div>
          </>}

          {/* PARTICLES animation */}
          {banner.heroAnim==="particles"&&[...Array(mob?6:10)].map((_,i)=>(
            <div key={i} style={{position:"absolute",bottom:0,left:`${8+i*9}%`,width:3,height:3,borderRadius:"50%",background:i%2===0?G:"#f5e199",animation:`heroParticle ${4+i*0.7}s ${i*0.5}s ease-in infinite`,pointerEvents:"none",boxShadow:`0 0 6px ${G}`}}/>
          ))}

          {/* BREATHE animation */}
          {banner.heroAnim==="breathe"&&(
            <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:mob?280:500,height:mob?280:500,borderRadius:"50%",pointerEvents:"none",animation:"heroBreathe 4s ease-in-out infinite"}}/>
          )}

          {/* Overlay */}
          <div style={{position:"absolute",inset:0,background:"linear-gradient(150deg,rgba(13,13,13,0.82) 0%,rgba(30,15,7,0.72) 50%,rgba(45,22,8,0.82) 100%)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 50%,rgba(201,169,110,0.12) 0%,transparent 65%)",pointerEvents:"none"}}/>

          {/* CONTENT */}
          <HeroContent mob={mob} G={G} lang={lang} t={t} setPage={setPage}/>
        </div>

        <div style={{background:`linear-gradient(90deg,${DARK} 0%,#1e0f07 50%,${DARK} 100%)`,padding:"13px 30px",display:"flex",justifyContent:"center",gap:mob?14:48,alignItems:"center",flexWrap:"wrap",position:"sticky",bottom:0,zIndex:50}}>
          {(lang==="ar"?["جودة فاخرة","صنع في المغرب","توصيل مجاني","ضمان الرضا"]:lang==="fr"?["Qualité Premium","Made in Morocco","Livraison Gratuite","Satisfaction Garantie"]:["Premium Quality","Made in Morocco","Free Delivery","Satisfaction Guaranteed"]).map((x,i)=>(
            <span key={i} style={{color:"rgba(201,169,110,0.85)",fontSize:mob?10:13,letterSpacing:lang==="ar"?"0.04em":"0.12em",fontFamily:"'Amiri',serif",fontWeight:700}}>{x}</span>
          ))}
        </div>

        {/* VIDEO BANNER */}
        {banner.videoUrl&&(!banner.expiresAt||new Date(banner.expiresAt)>new Date())&&<div style={{padding:mob?"24px 0":"52px 44px",background:BG}}>
          <div style={{maxWidth:900,margin:"0 auto"}}>
            {banner.title&&<div style={{textAlign:"center",marginBottom:20,padding:mob?"0 16px":0}}>
              <h2 style={{fontSize:mob?22:36,fontWeight:700,fontFamily:"'Amiri',serif",color:TEXT,marginBottom:10}}>{banner.title}</h2>
              <div className="divider"><span style={{color:G,fontSize:18}}>✦</span></div>
            </div>}
            <div style={{borderRadius:mob?0:20,overflow:"hidden",boxShadow:`0 20px 60px rgba(0,0,0,${night?0.5:0.15})`,border:mob?"none":`1px solid ${BORDER}`,position:"relative"}}>
              <video
                id="banner-video"
                src={banner.videoUrl}
                autoPlay muted loop playsInline
                style={{width:"100%",display:"block",height:mob?"56vw":undefined,maxHeight:mob?undefined:520,objectFit:"cover"}}
              />
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 60%,rgba(0,0,0,0.25))",pointerEvents:"none"}}/>
              <button onClick={()=>{const v=document.getElementById("banner-video");if(v){v.muted=!v.muted;v.volume=1;const btn=document.getElementById("mute-btn");if(btn)btn.textContent=v.muted?"🔇":"🔊";}}} id="mute-btn" style={{position:"absolute",bottom:14,right:14,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)",border:`1px solid rgba(255,255,255,0.2)`,borderRadius:"50%",width:40,height:40,fontSize:18,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>🔇</button>
            </div>
          </div>
        </div>}

        <div style={{padding:mob?"52px 16px":"84px 44px",background:BG}}>
          <div style={{textAlign:"center",marginBottom:50}}>
            <h2 style={{fontSize:mob?28:40,fontWeight:700,fontFamily:"'Amiri',serif",marginBottom:14}}>{t.featured}</h2>
            <div className="divider"><span style={{color:G,fontSize:20}}>✦</span></div>
          </div>
          <div className="pgrid" style={{maxWidth:1260,margin:"0 auto"}}>
            {products.slice(0,4).map(p=><ProductCard key={p.id} product={p} t={t} onAdd={addToCart} onOpenPopup={setPopup} categories={categories} night={night} notify={notify}/>)}
          </div>
          <div style={{textAlign:"center",marginTop:46}}>
            <button onClick={()=>setPage("shop")} style={{background:"transparent",color:TEXT,border:`2px solid ${TEXT}`,padding:"13px 46px",borderRadius:50,fontSize:15,fontWeight:700,fontFamily:"'Amiri',serif",letterSpacing:"0.07em",transition:"all .25s"}}>
              {t.shop} ←
            </button>
          </div>
        </div>

        <div style={{background:`linear-gradient(135deg,${DARK},#1e0f07)`,color:"#fff",padding:mob?"46px 20px":"64px 44px",textAlign:"center",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center,rgba(201,169,110,0.08) 0%,transparent 70%)"}}/>
          <p style={{position:"relative",fontSize:mob?13:15,letterSpacing:"0.22em",color:G,marginBottom:10,fontFamily:"'Amiri',serif",fontWeight:700}}>✦ {t.free} ✦</p>
          <p style={{position:"relative",color:"rgba(255,255,255,0.55)",fontFamily:"'Amiri',serif",fontSize:mob?14:16}}>{t.freeSub}</p>
        </div>

        {countdown.active&&countdown.endDate&&(
          <CountdownBanner endDate={countdown.endDate} title={countdown.title} subtitle={countdown.subtitle} mob={mob} lang={lang} onShop={()=>setPage("shop")}/>
        )}

        <InstagramGallery products={products} mob={mob} night={night} lang={lang} onOpenPopup={setPopup} instagram={siteSettings.instagram}/>
      </>}

      {/* SHOP */}
      {page==="shop"&&(
        <div className="page-section" style={{padding:mob?"24px 10px":"62px 44px",maxWidth:1300,margin:"0 auto"}}>
          <div style={{marginBottom:38}}>
            <h2 style={{fontSize:mob?30:44,fontWeight:700,fontFamily:"'Amiri',serif",marginBottom:7}}>{t.shop}</h2>
            <p style={{color:night?"rgba(240,235,228,0.5)":"#bbb",fontFamily:"'Amiri',serif",fontSize:14,letterSpacing:"0.06em"}}>{filtered.length} {t.pieces}</p>
          </div>
          <div className="cats">
            <button onClick={()=>setActiveCat("all")} style={{padding:mob?"8px 18px":"10px 26px",borderRadius:50,border:`2px solid ${activeCat==="all"?G:BORDER}`,background:activeCat==="all"?G:"transparent",color:activeCat==="all"?"#fff":TEXT,fontWeight:700,fontSize:mob?13:14,flexShrink:0,fontFamily:"'Amiri',serif",letterSpacing:"0.04em",transition:"all .25s"}}>
              {lang==="ar"?"الكل":lang==="fr"?"Tout":"All"}
            </button>
            {categories.map(c=>(
              <button key={c.id} onClick={()=>setActiveCat(c.name)} style={{padding:mob?"8px 18px":"10px 26px",borderRadius:50,border:`2px solid ${activeCat===c.name?G:BORDER}`,background:activeCat===c.name?G:"transparent",color:activeCat===c.name?"#fff":TEXT,fontWeight:700,fontSize:mob?13:14,flexShrink:0,fontFamily:"'Amiri',serif",letterSpacing:"0.04em",transition:"all .25s"}}>
                {c.icon&&<span style={{marginLeft:5}}>{c.icon}</span>}{c.name}
              </button>
            ))}
          </div>
          <div className="pgrid">
            {filtered.map(p=><ProductCard key={p.id} product={p} t={t} onAdd={addToCart} onOpenPopup={setPopup} categories={categories} night={night} notify={notify}/>)}
          </div>
        </div>
      )}

      {/* ABOUT */}
      {/* BEST SELLERS */}
      {page==="bestsellers"&&(
        <div style={{padding:mob?"32px 10px 60px":"62px 44px",maxWidth:1300,margin:"0 auto"}}>
          {/* Header */}
          <div style={{textAlign:"center",marginBottom:mob?36:56}}>
            <p style={{fontSize:11,letterSpacing:"0.3em",color:G,fontWeight:700,fontFamily:"'Amiri',serif",marginBottom:10,textTransform:"uppercase"}}>✦ &nbsp;{lang==="ar"?"الأكثر مبيعاً":lang==="fr"?"Meilleures ventes":"Best Sellers"}&nbsp; ✦</p>
            <h1 style={{fontSize:mob?28:48,fontWeight:900,fontFamily:"'Amiri',serif",color:TEXT,marginBottom:14}}>
              {lang==="ar"?"اختيار الزبائن":lang==="fr"?"Le choix de nos clientes":"Customer Favorites"}
              <svg width={mob?28:36} height={mob?28:36} viewBox="0 0 24 24" fill={G} style={{marginRight:8,marginLeft:8,verticalAlign:"middle",filter:`drop-shadow(0 2px 8px rgba(201,169,110,0.5))`}}>
                <path d="M2 19l2-9 4.5 4L12 5l3.5 9L20 10l2 9H2z"/>
                <circle cx="2" cy="19" r="1.5"/>
                <circle cx="22" cy="19" r="1.5"/>
                <circle cx="12" cy="5" r="1.5"/>
              </svg>
            </h1>
            <div className="divider"><span style={{color:G,fontSize:20}}>✦</span></div>
            <p style={{color:night?"rgba(240,235,228,0.5)":"#aaa",fontFamily:"'Amiri',serif",fontSize:mob?13:15,marginTop:8}}>
              {lang==="ar"?"المنتجات الأكثر طلباً من زبائننا الكرام":lang==="fr"?"Les produits les plus commandés par nos clientes":"The most ordered products by our customers"}
            </p>
          </div>

          {(()=>{
            // Calculate best sellers from orders
            const soldMap={};
            orders.forEach(o=>(o.items||[]).forEach(item=>{
              soldMap[item.id]=(soldMap[item.id]||0)+(item.qty||1);
            }));
            const ranked=products
              .map(p=>({...p,sold:soldMap[p.id]||0}))
              .filter(p=>p.sold>0)
              .sort((a,b)=>b.sold-a.sold);
            const withFallback=ranked.length>=3?ranked:[...ranked,...products.filter(p=>!soldMap[p.id]).slice(0,6-ranked.length)];

            return(
              <div>
                {/* Top 3 podium */}
                {withFallback.length>=1&&(
                  <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1.15fr 1fr",gap:mob?14:22,marginBottom:mob?24:44,alignItems:"end"}}>
                    {[withFallback[1],withFallback[0],withFallback[2]].map((p,i)=>{
                      if(!p)return<div key={i}/>;
                      const rank=i===1?1:i===0?2:3;
                      const crownColors=[
                        {bg:"linear-gradient(135deg,#C9A96E,#f5e199,#8b5e3c)",border:"#C9A96E",label:"#1",shadow:"rgba(201,169,110,0.6)"},
                        {bg:"linear-gradient(135deg,#b0b8c1,#e8edf2,#8a9bb0)",border:"#c0c8d0",label:"#2",shadow:"rgba(180,190,200,0.5)"},
                        {bg:"linear-gradient(135deg,#cd7f32,#e8a96e,#8b4513)",border:"#cd7f32",label:"#3",shadow:"rgba(205,127,50,0.5)"},
                      ];
                      const heights=mob?[0,0,0]:[0,30,0];
                      const img=(p.images&&p.images[0])||p.image;
                      return(
                        <div key={p.id} className="card" style={{background:CARD_BG,borderRadius:24,overflow:"hidden",boxShadow:rank===1?`0 20px 60px rgba(201,169,110,0.35)`:"0 8px 30px rgba(0,0,0,0.1)",border:rank===1?`2px solid ${G}`:`1px solid ${BORDER}`,marginTop:mob?0:-heights[i],cursor:"pointer",transform:rank===1&&!mob?"scale(1.04)":"scale(1)"}} onClick={()=>setPopup(p)}>
                          <div style={{position:"relative",height:mob?180:rank===1?320:260,overflow:"hidden"}}>
                            <img src={img} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .6s"}}/>
                            <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 50%)"}}/>
                            {/* Crown badge */}
                            <div style={{position:"absolute",top:12,left:12}}>
                              <div style={{background:crownColors[rank-1].bg,border:`2px solid ${crownColors[rank-1].border}`,borderRadius:12,padding:"5px 10px",display:"flex",alignItems:"center",gap:5,boxShadow:`0 4px 16px ${crownColors[rank-1].shadow}`,backdropFilter:"blur(4px)"}}>
                                {/* Crown SVG */}
                                <svg width={mob?14:16} height={mob?14:16} viewBox="0 0 24 24" fill="white" style={{filter:`drop-shadow(0 1px 3px rgba(0,0,0,0.3))`}}>
                                  <path d="M2 19l2-9 4.5 4L12 5l3.5 9L20 10l2 9H2z"/>
                                  <circle cx="2" cy="19" r="1.5" fill="white"/>
                                  <circle cx="22" cy="19" r="1.5" fill="white"/>
                                  <circle cx="12" cy="5" r="1.5" fill="white"/>
                                </svg>
                                <span style={{color:"#fff",fontFamily:"'Cinzel Decorative',serif",fontSize:mob?10:11,fontWeight:900,letterSpacing:"0.05em"}}>{crownColors[rank-1].label}</span>
                              </div>
                            </div>
                            {p.sold>0&&<div style={{position:"absolute",bottom:14,right:14,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)",color:"#fff",padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700,fontFamily:"'Amiri',serif",border:"1px solid rgba(255,255,255,0.2)"}}>
                              {p.sold} {lang==="ar"?"مبيع":lang==="fr"?"vendu(s)":"sold"}
                            </div>}
                          </div>
                          <div style={{padding:mob?"12px 14px":"16px 20px"}}>
                            <p style={{fontSize:10,color:G,fontWeight:700,marginBottom:4,letterSpacing:"0.1em"}}>{p.category}</p>
                            <h3 style={{fontWeight:700,fontSize:mob?13:16,fontFamily:"'Amiri',serif",color:TEXT,marginBottom:10,lineHeight:1.3}}>{p.name}</h3>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                              <span style={{fontSize:mob?16:20,fontWeight:700,fontFamily:"'Cinzel Decorative',serif",color:TEXT}}>{p.price} <span style={{fontSize:10,color:"#aaa"}}>DH</span></span>
                              <button className="btn-gold" onClick={e=>{e.stopPropagation();addToCart(p);}} style={{padding:mob?"7px 12px":"9px 18px",borderRadius:12,fontSize:mob?11:13}}>+ {t.addToCartShort}</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Rest of products */}
                {withFallback.length>3&&(
                  <div>
                    <div style={{textAlign:"center",marginBottom:24}}>
                      <p style={{color:night?"rgba(240,235,228,0.4)":"#bbb",fontSize:13,fontFamily:"'Amiri',serif"}}>
                        {lang==="ar"?"المزيد من المنتجات المميزة":lang==="fr"?"Plus de produits populaires":"More popular products"}
                      </p>
                    </div>
                    <div className="pgrid">
                      {withFallback.slice(3).map(p=>(
                        <ProductCard key={p.id} product={p} t={t} onAdd={addToCart} onOpenPopup={setPopup} categories={categories} night={night} notify={notify}/>
                      ))}
                    </div>
                  </div>
                )}

                {withFallback.length===0&&(
                  <div style={{textAlign:"center",padding:"80px 0"}}>
                    <div style={{fontSize:64,marginBottom:16}}>📦</div>
                    <p style={{color:"#aaa",fontFamily:"'Amiri',serif",fontSize:18}}>
                      {lang==="ar"?"لا توجد مبيعات بعد — ابدأ البيع!":lang==="fr"?"Pas encore de ventes":"No sales yet — start selling!"}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {page==="about"&&(
        <div style={{maxWidth:960,margin:"0 auto",padding:mob?"52px 18px 80px":"100px 44px 120px"}}>

          {/* HERO */}
          <div style={{textAlign:"center",marginBottom:72}}>
            <p style={{fontSize:11,letterSpacing:"0.35em",color:G,fontWeight:700,fontFamily:"'Amiri',serif",marginBottom:18,textTransform:"uppercase"}}>
              ✦ &nbsp;{lang==="ar"?"قصتنا":lang==="fr"?"Notre Histoire":"Our Story"}&nbsp; ✦
            </p>
            <Logo size={mob?"md":"lg"} tagline={t.heroSub} inverted={night}/>
            <div style={{width:60,height:2,background:`linear-gradient(90deg,transparent,${G},transparent)`,margin:"28px auto"}}/>
            <p style={{fontSize:mob?16:18,color:night?"rgba(240,235,228,0.65)":"#888",lineHeight:2.2,maxWidth:560,margin:"0 auto",fontFamily:"'Amiri',serif",fontWeight:400}}>
              {lang==="ar"
                ?"YLAAF علامة مغربية راقية تجمع بين الأصالة والحداثة، نختار لك أجمل المنتجات بجودة عالية وأسعار في متناول الجميع."
                :lang==="fr"
                ?"YLAAF, marque marocaine premium alliant tradition et modernité. Nous sélectionnons pour vous les plus beaux produits avec qualité et style."
                :"YLAAF is a premium Moroccan brand blending heritage and modernity, curating the finest products with quality and style."}
            </p>
          </div>

          {/* 3 VALUE CARDS */}
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(3,1fr)",gap:mob?16:24,marginBottom:72}}>
            {[
              {
                svg:<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
                ar:"جودة فاخرة",fr:"Qualité Premium",en:"Premium Quality",
                subAr:"نختار أجود الخامات لكل منتج بعناية فائقة",
                subFr:"Matériaux soigneusement sélectionnés",
                subEn:"Every product hand-picked for the finest quality"
              },
              {
                svg:<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20M2 12h20"/></svg>,
                ar:"صنع في المغرب",fr:"Made in Morocco",en:"Made in Morocco",
                subAr:"حرفية مغربية أصيلة بلمسة عصرية",
                subFr:"Artisanat marocain authentique",
                subEn:"Authentic Moroccan craftsmanship, modern touch"
              },
              {
                svg:<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
                ar:"ضمان الرضا",fr:"Satisfaction Garantie",en:"Satisfaction Guaranteed",
                subAr:"رضاك هو أولويتنا الأولى والأخيرة",
                subFr:"Votre bonheur est notre priorité",
                subEn:"Your happiness is our first priority"
              }
            ].map((x,i)=>(
              <div key={i} style={{background:CARD_BG,borderRadius:24,padding:mob?"28px 22px":"40px 32px",textAlign:"center",border:`1px solid ${BORDER}`,position:"relative",overflow:"hidden",transition:"transform .3s,box-shadow .3s"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 20px 50px rgba(201,169,110,0.15)`;}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${G},transparent)`}}/>
                <div style={{width:64,height:64,borderRadius:"50%",background:`rgba(201,169,110,0.08)`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
                  {x.svg}
                </div>
                <h3 style={{fontWeight:700,fontFamily:"'Amiri',serif",fontSize:mob?17:19,marginBottom:10,color:TEXT}}>{lang==="ar"?x.ar:lang==="fr"?x.fr:x.en}</h3>
                <p style={{color:night?"rgba(240,235,228,0.45)":"#aaa",fontSize:13,fontFamily:"'Amiri',serif",lineHeight:1.9}}>{lang==="ar"?x.subAr:lang==="fr"?x.subFr:x.subEn}</p>
              </div>
            ))}
          </div>

          {/* CONTACT CARD */}
          <div style={{background:`linear-gradient(135deg,#0d0d0d 0%,#1a1008 50%,#0d0d0d 100%)`,borderRadius:28,padding:mob?"36px 24px":"52px 56px",color:"#fff",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 30% 50%,rgba(201,169,110,0.12) 0%,transparent 65%)"}}/>
            <div style={{position:"absolute",top:-40,right:-40,width:200,height:200,borderRadius:"50%",border:"1px solid rgba(201,169,110,0.08)"}}/>
            <div style={{position:"absolute",bottom:-60,left:-20,width:160,height:160,borderRadius:"50%",border:"1px solid rgba(201,169,110,0.06)"}}/>
            <div style={{position:"relative",textAlign:"center"}}>
              <p style={{fontSize:11,letterSpacing:"0.32em",color:G,fontWeight:700,fontFamily:"'Amiri',serif",marginBottom:12}}>✦ &nbsp;{t.contact}&nbsp; ✦</p>
              <h2 style={{fontSize:mob?22:30,fontWeight:700,fontFamily:"'Amiri',serif",marginBottom:8}}>
                {lang==="ar"?"تواصل معنا":lang==="fr"?"Contactez-nous":"Get in touch"}
              </h2>
              <p style={{color:"rgba(255,255,255,0.4)",fontSize:13,fontFamily:"'Amiri',serif",marginBottom:40}}>
                {lang==="ar"?"نحن هنا لمساعدتك في أي وقت":lang==="fr"?"Nous sommes là pour vous aider":"We're here to help anytime"}
              </p>

              {/* PHONE CARD */}
              <a href={`https://wa.me/${siteSettings.whatsapp}`} target="_blank" rel="noreferrer" style={{textDecoration:"none",display:"inline-flex",alignItems:"center",gap:20,background:"rgba(255,255,255,0.05)",backdropFilter:"blur(12px)",border:"1px solid rgba(201,169,110,0.25)",borderRadius:20,padding:mob?"18px 24px":"22px 40px",transition:"all .3s",cursor:"pointer"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,169,110,0.1)";e.currentTarget.style.borderColor=G;}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.05)";e.currentTarget.style.borderColor="rgba(201,169,110,0.25)";}}>
                {/* Phone SVG icon */}
                <div style={{width:52,height:52,borderRadius:"50%",background:`rgba(201,169,110,0.15)`,border:`1px solid rgba(201,169,110,0.3)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.8">
                    <rect x="5" y="2" width="14" height="20" rx="3" ry="3"/>
                    <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{textAlign:"left",direction:"ltr"}}>
                  <p style={{color:"rgba(255,255,255,0.5)",fontSize:11,letterSpacing:"0.15em",fontFamily:"'Amiri',serif",marginBottom:5,textTransform:"uppercase"}}>WhatsApp</p>
                  <p style={{color:"#fff",fontFamily:"'Cinzel Decorative',serif",fontSize:mob?14:16,letterSpacing:"0.06em",fontWeight:700}}>+{siteSettings.whatsapp}</p>
                </div>
                {/* Arrow */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(201,169,110,0.6)" strokeWidth="2" style={{marginLeft:8,flexShrink:0}}>
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
            </div>
          </div>

        </div>
      )}

      {/* CART */}
      {cartOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:1000}}>
          <div onClick={()=>setCartOpen(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(5px)"}}/>
          <div className="cw" style={{position:"absolute",right:0,top:0,bottom:0,background:CARD_BG,boxShadow:"-14px 0 60px rgba(0,0,0,0.18)",display:"flex",flexDirection:"column",animation:"slideIn .32s cubic-bezier(.22,.68,0,1.2)"}}>
            <div style={{padding:"18px 22px",borderBottom:`1px solid rgba(201,169,110,0.15)`,display:"flex",justifyContent:"space-between",alignItems:"center",background:DARK}}>
              <h2 style={{fontWeight:700,fontSize:18,color:"#fff",fontFamily:"'Amiri',serif"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> {t.cart} ({totalItems})</h2>
              <button onClick={()=>setCartOpen(false)} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.2)",color:"#fff",borderRadius:8,padding:"7px 10px",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"16px 18px"}}>
              {cart.length===0?(
                <div style={{textAlign:"center",padding:"72px 0",color:"#ccc"}}>
                  <div style={{fontSize:58,marginBottom:16}}>🛒</div>
                  <p style={{fontWeight:600,fontFamily:"'Amiri',serif",fontSize:17}}>{t.empty}</p>
                </div>
              ):cart.map(item=>{
                const img=(item.images&&item.images[0])||item.image;
                return (
                  <div key={item.id} style={{display:"flex",gap:12,marginBottom:14,padding:13,background:night?"#222":"#faf8f5",borderRadius:14,border:`1px solid ${BORDER}`}}>
                    <img src={img} alt={item.name} style={{width:66,height:66,borderRadius:10,objectFit:"cover"}}/>
                    <div style={{flex:1}}>
                      <p style={{fontWeight:700,fontSize:14,marginBottom:2,fontFamily:"'Amiri',serif",color:TEXT}}>{item.name}</p>
                      {item.size&&<span style={{fontSize:11,background:G,color:"#fff",borderRadius:8,padding:"2px 8px",fontWeight:700,display:"inline-block",marginBottom:4}}>{item.size}</span>}
                      <p style={{color:G,fontWeight:700,marginBottom:8,fontSize:14,fontFamily:"'Cinzel Decorative',serif"}}>{item.price} DH</p>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <button onClick={()=>updateQty(item.id,item.size,-1)} style={{width:26,height:26,borderRadius:7,border:`1px solid ${BORDER}`,background:CARD_BG,color:TEXT,fontSize:16,fontWeight:700}}>-</button>
                        <span style={{fontWeight:800,fontSize:15,color:TEXT}}>{item.qty}</span>
                        <button onClick={()=>updateQty(item.id,item.size,1)} style={{width:26,height:26,borderRadius:7,border:`1px solid ${BORDER}`,background:CARD_BG,color:TEXT,fontSize:16,fontWeight:700}}>+</button>
                        <button onClick={()=>removeFromCart(item.id,item.size)} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center"}}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e57373" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {cart.length>0&&(
              <div style={{padding:"16px 18px",borderTop:`1px solid ${BORDER}`,background:night?"#111":CARD_BG}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:14,paddingBottom:14,borderBottom:`1px solid ${BORDER}`}}>
                  <span style={{fontWeight:700,fontSize:16,fontFamily:"'Amiri',serif",color:TEXT}}>{t.total}</span>
                  <span style={{fontWeight:700,fontSize:23,fontFamily:"'Cinzel Decorative',serif",color:G}}>{totalPrice} DH</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:13}}>
                  {[["name",t.name],["phone",t.phone],["address",t.address]].map(([f,ph])=>(
                    <input key={f} value={orderForm[f]} onChange={e=>setOrderForm(p=>({...p,[f]:e.target.value}))} placeholder={ph} style={{padding:"11px 14px",borderRadius:11,border:`1.5px solid ${BORDER}`,fontSize:14,outline:"none",background:CARD_BG,color:TEXT}}/>
                  ))}
                </div>
                <a
                  href={orderForm.name&&orderForm.phone?`https://api.whatsapp.com/send?phone=${siteSettings.whatsapp}&text=${sendOrder()||""}`:"#"}
                  onClick={e=>{
                    if(!orderForm.name||!orderForm.phone){e.preventDefault();notify("⚠️ "+(t.dir==="rtl"?"أدخل اسمك ورقم هاتفك":"Enter your name and phone"));return;}
                    handleOrder();
                  }}
                  target="_blank"
                  rel="noreferrer"
                  style={{display:"block",width:"100%",background:"linear-gradient(135deg,#25D366,#128C7E)",color:"#fff",padding:"14px",borderRadius:13,fontSize:15,fontWeight:700,fontFamily:"'Amiri',serif",letterSpacing:"0.06em",textAlign:"center",textDecoration:"none",boxSizing:"border-box"}}>
                  📱 {t.send}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN */}
      {adminOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div onClick={()=>setAdminOpen(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.72)",backdropFilter:"blur(7px)"}}/>
          <div className="aw" style={{position:"relative",background:CARD_BG,borderRadius:24,maxHeight:"92vh",overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.42)",display:"flex",flexDirection:"column",animation:"scaleIn .3s cubic-bezier(.22,.68,0,1.2)"}}>
            {!adminOK?(
              <div style={{padding:mob?34:56,textAlign:"center"}}>
                <div style={{fontSize:48,marginBottom:16}}>🔐</div>
                <h2 style={{fontWeight:700,marginBottom:24,fontFamily:"'Amiri',serif",fontSize:24}}>{t.adminTitle}</h2>
                <input type="password" value={adminPass} onChange={e=>{setAdminPass(e.target.value);setPassErr(false);}} onKeyDown={e=>{if(e.key==="Enter"){adminPass===ADMIN_PASSWORD?setAdminOK(true):setPassErr(true);}}} placeholder={t.adminPass} style={{width:"100%",padding:"13px 16px",borderRadius:12,border:passErr?"2px solid #e57373":"1.5px solid #e0d6cc",fontSize:15,marginBottom:13,outline:"none",boxSizing:"border-box",textAlign:"center"}}/>
                {passErr&&<p style={{color:"#e57373",fontWeight:600,marginBottom:13,fontFamily:"'Amiri',serif"}}>{t.wrongPass}</p>}
                <button className="btn-gold" onClick={()=>adminPass===ADMIN_PASSWORD?setAdminOK(true):setPassErr(true)} style={{padding:"13px 50px",borderRadius:12,fontSize:16,letterSpacing:"0.08em"}}>{t.adminLogin}</button>
              </div>
            ):(
              <>
                <div style={{background:`linear-gradient(135deg,${DARK},#1e0f07)`,color:"#fff",padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:9}}>
                  <div style={{display:"flex",gap:9,alignItems:"center",flexWrap:"wrap"}}>
                    <Logo size="sm" inverted/>
                    {["dashboard","products","categories","banner","countdown","orders","settings","subscribers"].map(s=>(
                      <button key={s} onClick={()=>setAdminTab(s)} style={{background:adminTab===s?G:"transparent",color:"#fff",border:`1px solid ${G}`,padding:"5px 14px",borderRadius:18,fontWeight:600,fontSize:12,fontFamily:"'Amiri',serif"}}>
                        {s==="dashboard"?(lang==="ar"?"لوحة التحكم":"Dashboard"):s==="products"?t.manageProducts:s==="categories"?(lang==="ar"?"الكاتيغوريات":"Categories"):s==="banner"?(lang==="ar"?"الفيديو":"Video"):s==="countdown"?(lang==="ar"?"⏱️ عرض محدود":"⏱️ Countdown"):s==="settings"?"⚙️ "+(lang==="ar"?"الإعدادات":"Settings"):s==="subscribers"?`🔔 ${lang==="ar"?"المشتركين":"Subscribers"}${subscribers.length>0?` (${subscribers.length})`:""}`:`${t.viewOrders}${orders.length>0?` (${orders.length})`:""}`}
                      </button>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:7}}>
                    <button onClick={()=>{setAdminOK(false);setAdminPass("");setAdminOpen(false);}} style={{background:"transparent",color:"#ccc",border:"1px solid #555",padding:"4px 11px",borderRadius:7,fontSize:12,fontFamily:"'Amiri',serif"}}>{t.logout}</button>
                    <button onClick={()=>setAdminOpen(false)} style={{background:"none",border:"none",color:"#bbb",display:"flex",alignItems:"center",justifyContent:"center",padding:6}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                  </div>
                </div>
                <div style={{overflowY:"auto",padding:18,flex:1}}>
                  {adminTab==="dashboard"&&(()=>{
                    const totalRevenue=orders.reduce((a,o)=>a+o.total,0);
                    const topProducts=products.map(p=>({...p,sold:orders.reduce((a,o)=>a+(o.items?.find(i=>i.id===p.id)?.qty||0),0)})).sort((a,b)=>b.sold-a.sold).slice(0,5);
                    return(
                    <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:14,marginBottom:20}}>
                      {[
                        {label:lang==="ar"?"إجمالي الطلبات":"Total Orders",value:orders.length,color:"#3498db"},
                        {label:lang==="ar"?"إجمالي المبيعات":"Total Revenue",value:totalRevenue+" DH",color:G},
                        {label:lang==="ar"?"عدد المنتجات":"Products",value:products.length,color:"#27ae60"},
                        {label:lang==="ar"?"نفد المخزون":"Out of Stock",value:products.filter(p=>p.stock===0).length,color:"#e74c3c"},
                      ].map((s,i)=>(
                        <div key={i} style={{background:"#fff",borderRadius:14,padding:18,border:`2px solid ${s.color}22`,textAlign:"center"}}>
                          <p style={{fontSize:28,fontWeight:800,color:s.color,fontFamily:"'Cinzel Decorative',serif"}}>{s.value}</p>
                          <p style={{fontSize:12,color:"#888",fontFamily:"'Amiri',serif",marginTop:4}}>{s.label}</p>
                        </div>
                      ))}
                      <div style={{gridColumn:mob?"1/-1":"1/-1",background:"#fff",borderRadius:14,padding:18,border:`1px solid rgba(201,169,110,0.14)`}}>
                        <h4 style={{fontWeight:700,marginBottom:12,fontFamily:"'Amiri',serif",fontSize:14}}>{lang==="ar"?"أكثر المنتجات مبيعاً":"Top Products"}</h4>
                        {topProducts.map((p,i)=>(
                          <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<4?`1px solid #f5f0eb`:"none"}}>
                            <span style={{background:G,color:"#fff",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0}}>{i+1}</span>
                            <img src={(p.images&&p.images[0])||p.image} alt={p.name} style={{width:36,height:36,borderRadius:8,objectFit:"cover"}}/>
                            <div style={{flex:1}}><p style={{fontWeight:700,fontSize:13,fontFamily:"'Amiri',serif"}}>{p.name}</p><p style={{color:"#aaa",fontSize:11}}>{p.price} DH{p.stock!=null?" · "+p.stock+" "+( lang==="ar"?"في المخزون":"in stock"):""}</p></div>
                            <span style={{fontWeight:700,color:G,fontSize:13}}>{p.sold} {lang==="ar"?"مبيع":"sold"}</span>
                          </div>
                        ))}
                      </div>
                    </div>);
                  })()}

                  {adminTab==="products"&&<>
                    <div style={{background:"#faf8f5",borderRadius:16,padding:18,marginBottom:20,border:`1px solid rgba(201,169,110,0.14)`}}>
                      <h3 style={{fontWeight:700,marginBottom:14,fontSize:15,fontFamily:"'Amiri',serif"}}>➕ {t.addProduct}</h3>
                      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>
                        <div><label style={{display:"block",fontSize:12,fontWeight:700,color:"#888",marginBottom:5,fontFamily:"'Amiri',serif"}}>{lang==="ar"?"اسم المنتج":lang==="fr"?"Nom du produit":"Product Name"}</label><input value={newProd.name} onChange={e=>setNewProd(p=>({...p,name:e.target.value}))} placeholder={t.productName} style={{width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid #e0d6cc",fontSize:14,outline:"none"}}/></div>
                        <div><label style={{display:"block",fontSize:12,fontWeight:700,color:"#888",marginBottom:5,fontFamily:"'Amiri',serif"}}>{lang==="ar"?"السعر (درهم)":lang==="fr"?"Prix (DH)":"Price (DH)"}</label><input value={newProd.price} onChange={e=>setNewProd(p=>({...p,price:e.target.value}))} placeholder={t.productPrice} type="number" style={{width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid #e0d6cc",fontSize:14,outline:"none"}}/></div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>
                        <div><label style={{display:"block",fontSize:12,fontWeight:700,color:"#888",marginBottom:5,fontFamily:"'Amiri',serif"}}>{lang==="ar"?"نسبة التخفيض %":lang==="fr"?"Réduction %":"Discount %"}</label><input value={newProd.discount} onChange={e=>setNewProd(p=>({...p,discount:e.target.value}))} placeholder="0" type="number" min="0" max="90" style={{width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid #e0d6cc",fontSize:14,outline:"none"}}/></div>
                        <div><label style={{display:"block",fontSize:12,fontWeight:700,color:"#888",marginBottom:5,fontFamily:"'Amiri',serif"}}>{lang==="ar"?"Badge (حصري / ...)":lang==="fr"?"Badge":"Badge"}</label><input value={newProd.badge} onChange={e=>setNewProd(p=>({...p,badge:e.target.value}))} placeholder="حصري / ..." style={{width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid #e0d6cc",fontSize:14,outline:"none"}}/></div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>
                        <div><label style={{display:"block",fontSize:12,fontWeight:700,color:"#27ae60",marginBottom:5,fontFamily:"'Amiri',serif"}}>🟢 {lang==="ar"?"مدة badge جديد (أيام)":lang==="fr"?"Durée 'Nouveau' (jours)":"'New' badge duration (days)"}</label><input value={newProd.newDays} onChange={e=>setNewProd(p=>({...p,newDays:e.target.value}))} placeholder="0" type="number" min="0" style={{width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid #27ae60",fontSize:14,outline:"none"}}/></div>
                        <div><label style={{display:"block",fontSize:12,fontWeight:700,color:"#888",marginBottom:5,fontFamily:"'Amiri',serif"}}>{lang==="ar"?"الكمية في المخزون":"Stock quantity"}</label><input value={newProd.stock} onChange={e=>setNewProd(p=>({...p,stock:e.target.value}))} placeholder={lang==="ar"?"فارغ = غير محدود":"-"} type="number" min="0" style={{width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid #e0d6cc",fontSize:14,outline:"none"}}/></div>
                      </div>
                      <div style={{marginBottom:10}}>
                        <label style={{display:"block",fontSize:12,fontWeight:700,color:"#888",marginBottom:7,fontFamily:"'Amiri',serif"}}>{lang==="ar"?"المقاسات المتوفرة":"Available Sizes"}</label>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                          {["XS","S","M","L","XL","XXL"].map(s=>{
                            const sel=newProd.sizes.includes(s);
                            return <button key={s} type="button" onClick={()=>setNewProd(p=>({...p,sizes:sel?p.sizes.filter(x=>x!==s):[...p.sizes,s]}))} style={{padding:"6px 14px",borderRadius:20,border:`2px solid ${sel?G:"#e0d6cc"}`,background:sel?G:"transparent",color:sel?"#fff":"#888",fontWeight:700,fontSize:13,cursor:"pointer",transition:"all .2s"}}>{s}</button>;
                          })}
                        </div>
                        {newProd.sizes.length===0&&<p style={{fontSize:11,color:"#aaa",marginTop:5,fontFamily:"'Amiri',serif"}}>{lang==="ar"?"ما خيرتيش → ما كيبانش عند الزبون":"No size selected → hidden"}</p>}
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:10,marginBottom:10}}>
                        <div><label style={{display:"block",fontSize:12,fontWeight:700,color:"#888",marginBottom:5,fontFamily:"'Amiri',serif"}}>{lang==="ar"?"الكاتيغوري":"Category"}</label><select value={newProd.category} onChange={e=>setNewProd(p=>({...p,category:e.target.value}))} style={{width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid #e0d6cc",fontSize:14,outline:"none",background:"#fff"}}><option value="">{lang==="ar"?"اختار كاتيغوري":"Choose category"}</option>{categories.map(c=><option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}</select></div>
                        <div><label style={{display:"block",fontSize:12,fontWeight:700,color:"#888",marginBottom:5,fontFamily:"'Amiri',serif"}}>{lang==="ar"?"أيقونة إضافية (اختياري)":"Extra icon (optional)"}</label><input value={newProd.categoryIcon} onChange={e=>setNewProd(p=>({...p,categoryIcon:e.target.value}))} placeholder="👗" style={{width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid #e0d6cc",fontSize:14,outline:"none"}}/></div>
                      </div>
                      {newProd.discount>0&&newProd.price&&<p style={{color:G,fontSize:13,marginBottom:8,fontFamily:"'Amiri',serif"}}>💰 {lang==="ar"?"السعر بعد التخفيض":lang==="fr"?"Prix après réduction":"Price after discount"}: {Math.round(parseInt(newProd.price)*(1-parseInt(newProd.discount)/100))} DH</p>}
                      <label style={{display:"block",fontWeight:700,marginBottom:7,fontSize:13,fontFamily:"'Amiri',serif"}}>📸 {t.productImage}</label>
                      <input type="file" accept="image/*" multiple onChange={handleImages} style={{width:"100%",padding:8,borderRadius:10,border:"1.5px solid #e0d6cc",fontSize:13,background:"#fff",marginBottom:10}}/>
                      {newProd.images.length>0&&<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>{newProd.images.map((img,i)=><img key={i} src={img} alt="" style={{width:62,height:62,borderRadius:9,objectFit:"cover",border:`2px solid ${G}`}}/>)}</div>}
                      <button className="btn-gold" onClick={addProduct} style={{width:"100%",padding:"12px",borderRadius:10,fontSize:14,letterSpacing:"0.06em"}}>➕ {t.save}</button>
                    </div>
                    <div className="ag">
                      {products.map(p=>{
                        const img=(p.images&&p.images[0])||p.image;
                        return (
                          <div key={p.id} style={{background:"#fff",borderRadius:13,overflow:"hidden",boxShadow:"0 3px 14px rgba(0,0,0,0.07)",border:`1px solid rgba(201,169,110,0.1)`}}>
                            <img src={img} alt={p.name} style={{width:"100%",height:115,objectFit:"cover"}}/>
                            <div style={{padding:10}}>
                              <p style={{fontWeight:700,fontSize:13,marginBottom:3,fontFamily:"'Amiri',serif"}}>{p.name}</p>
                              <p style={{color:G,fontWeight:700,marginBottom:7,fontSize:13,fontFamily:"'Cinzel Decorative',serif"}}>{p.price} DH</p>
                              <div style={{display:"flex",gap:6}}>
                                <button onClick={()=>setEditProd({...p,discount:p.discount||0,newDays:0,sizes:p.sizes||[]})} style={{flex:1,background:"#f0f7ff",color:"#3498db",border:"1px solid #bee3f8",padding:"6px",borderRadius:7,fontWeight:700,fontSize:12,fontFamily:"'Amiri',serif"}}>✏️ {lang==="ar"?"تعديل":"Edit"}</button>
                                <button onClick={()=>deleteProduct(p.id)} style={{flex:1,background:"#fff0f0",color:"#e57373",border:"1px solid #fdd",padding:"6px",borderRadius:7,fontWeight:700,fontSize:12,fontFamily:"'Amiri',serif"}}>🗑️ {t.delete}</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>}
                  {adminTab==="categories"&&(
                    <div>
                      <div style={{background:"#faf8f5",borderRadius:16,padding:18,marginBottom:20,border:`1px solid rgba(201,169,110,0.14)`}}>
                        <h3 style={{fontWeight:700,marginBottom:14,fontSize:15,fontFamily:"'Amiri',serif"}}>➕ {lang==="ar"?"إضافة كاتيغوري":lang==="fr"?"Ajouter catégorie":"Add Category"}</h3>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 80px",gap:10,marginBottom:10}}>
                          <input value={newCat.name} onChange={e=>setNewCat(p=>({...p,name:e.target.value}))} placeholder={lang==="ar"?"اسم الكاتيغوري":lang==="fr"?"Nom":"Category name"} style={{padding:"10px 13px",borderRadius:10,border:"1.5px solid #e0d6cc",fontSize:14,outline:"none"}}/>
                          <input value={newCat.icon} onChange={e=>setNewCat(p=>({...p,icon:e.target.value}))} placeholder="👗" style={{padding:"10px 13px",borderRadius:10,border:"1.5px solid #e0d6cc",fontSize:18,outline:"none",textAlign:"center"}}/>
                        </div>
                        <button className="btn-gold" onClick={addCategory} style={{width:"100%",padding:"11px",borderRadius:10,fontSize:14}}>➕ {lang==="ar"?"حفظ":lang==="fr"?"Enregistrer":"Save"}</button>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        {categories.length===0?(
                          <p style={{textAlign:"center",color:"#bbb",fontFamily:"'Amiri',serif",padding:"20px 0"}}>{lang==="ar"?"لا توجد كاتيغوريات بعد":lang==="fr"?"Aucune catégorie":"No categories yet"}</p>
                        ):categories.map(c=>(
                          <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fff",borderRadius:12,padding:"12px 16px",border:`1px solid rgba(201,169,110,0.14)`}}>
                            <span style={{fontWeight:700,fontFamily:"'Amiri',serif",fontSize:15}}>{c.icon&&<span style={{marginLeft:8}}>{c.icon}</span>}{c.name}</span>
                            <button onClick={()=>deleteCategory(c.id)} style={{background:"#fff0f0",color:"#e57373",border:"1px solid #fdd",padding:"5px 12px",borderRadius:7,fontWeight:700,fontSize:12,fontFamily:"'Amiri',serif"}}>🗑️ {t.delete}</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {adminTab==="banner"&&(
                    <div style={{display:"flex",flexDirection:"column",gap:16}}>
                    {/* HERO BACKGROUND */}
                    <div style={{background:"#faf8f5",borderRadius:16,padding:18,border:"1px solid rgba(201,169,110,0.14)"}}>
                      <h3 style={{fontWeight:700,marginBottom:6,fontSize:15,fontFamily:"'Amiri',serif"}}>🖼️ {lang==="ar"?"خلفية الـ Hero":"Hero Background"}</h3>
                      <p style={{color:"#aaa",fontSize:12,fontFamily:"'Amiri',serif",marginBottom:14}}>{lang==="ar"?"صورة أو فيديو يظهر خلف YLAAF":"Image or video behind YLAAF"}</p>
                      <input type="file" accept="image/*,video/*" onChange={async(e)=>{
                        const file=e.target.files[0];if(!file)return;
                        const isVid=file.type.startsWith("video");
                        notify(`⏳ ${lang==="ar"?"جاري الرفع...":"Uploading..."}`);
                        const fd=new FormData();fd.append("file",file);fd.append("upload_preset","r3uemf9r");fd.append("cloud_name","dcg34jeuy");
                        if(isVid)fd.append("resource_type","video");
                        const res=await fetch(`https://api.cloudinary.com/v1_1/dcg34jeuy/${isVid?"video":"image"}/upload`,{method:"POST",body:fd});
                        const data=await res.json();
                        if(data.secure_url){setBanner(b=>({...b,heroUrl:data.secure_url}));notify("✅ "+(lang==="ar"?"تم الرفع!":"Uploaded!"));}
                      }} style={{width:"100%",padding:8,borderRadius:10,border:"1.5px solid #e0d6cc",fontSize:13,background:"#fff",cursor:"pointer",marginBottom:12}}/>
                      {banner.heroUrl&&(
                        <div style={{position:"relative",borderRadius:12,overflow:"hidden",marginBottom:12,maxHeight:120}}>
                          {banner.heroUrl.match(/\.(mp4|webm|mov)$/i)
                            ? <video src={banner.heroUrl} muted autoPlay loop playsInline style={{width:"100%",height:120,objectFit:"cover"}}/>
                            : <img src={banner.heroUrl} alt="" style={{width:"100%",height:120,objectFit:"cover"}}/>
                          }
                          <button onClick={()=>setBanner(b=>({...b,heroUrl:""}))} style={{position:"absolute",top:6,right:6,background:"rgba(231,76,60,0.9)",color:"#fff",border:"none",borderRadius:7,padding:"3px 9px",fontWeight:700,fontSize:11,cursor:"pointer"}}>✕</button>
                        </div>
                      )}

                      {/* ANIMATION SELECTOR */}
                      <p style={{fontWeight:700,fontSize:12,color:"#888",marginBottom:8,fontFamily:"'Amiri',serif"}}>✨ {lang==="ar"?"أنيميشن الخلفية":"Background Animation"}</p>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:12}}>
                        {[
                          {id:"none",label:lang==="ar"?"بلا":"None",icon:"⬜"},
                          {id:"rings",label:lang==="ar"?"دوائر":"Rings",icon:"⭕"},
                          {id:"particles",label:lang==="ar"?"جزيئات":"Particles",icon:"✨"},
                          {id:"breathe",label:lang==="ar"?"نبضة":"Breathe",icon:"💛"},
                        ].map(a=>(
                          <button key={a.id} onClick={()=>setBanner(b=>({...b,heroAnim:a.id}))}
                            style={{padding:"10px 8px",borderRadius:10,border:`2px solid ${(banner.heroAnim||"none")===a.id?G:"#e0d6cc"}`,background:(banner.heroAnim||"none")===a.id?`rgba(201,169,110,0.1)`:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Amiri',serif",display:"flex",alignItems:"center",gap:6,justifyContent:"center",color:(banner.heroAnim||"none")===a.id?G:"#888"}}>
                            <span>{a.icon}</span>{a.label}
                          </button>
                        ))}
                      </div>

                      {/* BG image animation */}
                      {banner.heroUrl&&<>
                        <p style={{fontWeight:700,fontSize:12,color:"#888",marginBottom:8,fontFamily:"'Amiri',serif"}}>🖼️ {lang==="ar"?"حركة الصورة":"Image Motion"}</p>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
                          {[
                            {id:"none",label:lang==="ar"?"ثابتة":"Static"},
                            {id:"zoom",label:lang==="ar"?"زووم":"Zoom"},
                            {id:"drift",label:lang==="ar"?"انجراف":"Drift"},
                          ].map(a=>(
                            <button key={a.id} onClick={()=>setBanner(b=>({...b,heroBgAnim:a.id}))}
                              style={{padding:"8px",borderRadius:9,border:`2px solid ${(banner.heroBgAnim||"none")===a.id?G:"#e0d6cc"}`,background:(banner.heroBgAnim||"none")===a.id?`rgba(201,169,110,0.1)`:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Amiri',serif",color:(banner.heroBgAnim||"none")===a.id?G:"#888"}}>
                              {a.label}
                            </button>
                          ))}
                        </div>
                      </>}

                      <button className="btn-gold" onClick={async()=>{
                        await setDoc(doc(db,"settings","banner"),banner);
                        notify("✅ "+(lang==="ar"?"تم الحفظ!":"Saved!"));
                      }} style={{padding:"9px 22px",borderRadius:10,fontSize:13}}>💾 {lang==="ar"?"حفظ":"Save"}</button>
                    </div>
                      <h3 style={{fontWeight:700,marginBottom:16,fontSize:15,fontFamily:"'Amiri',serif"}}>🎬 {lang==="ar"?"إعداد الفيديو الإعلاني":"Video Banner Settings"}</h3>
                      <div style={{marginBottom:12}}>
                        <label style={{display:"block",fontSize:12,fontWeight:700,color:"#888",marginBottom:5,fontFamily:"'Amiri',serif"}}>{lang==="ar"?"عنوان القسم":"Section Title"}</label>
                        <input value={banner.title} onChange={e=>setBanner(b=>({...b,title:e.target.value}))} placeholder={lang==="ar"?"مثال: تشكيلتنا الجديدة":"Ex: Our New Collection"} style={{width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid #e0d6cc",fontSize:14,outline:"none"}}/>
                      </div>
                      <div style={{marginBottom:12}}>
                        <label style={{display:"block",fontSize:12,fontWeight:700,color:"#888",marginBottom:5,fontFamily:"'Amiri',serif"}}>📅 {lang==="ar"?"مدة الإعلان (أيام)":"Ad duration (days)"}</label>
                        <input value={banner.days||""} onChange={e=>setBanner(b=>({...b,days:e.target.value}))} placeholder="مثال: 7" type="number" min="1" style={{width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid #e0d6cc",fontSize:14,outline:"none"}}/>
                        {banner.days>0&&<p style={{fontSize:12,color:"#27ae60",marginTop:4,fontFamily:"'Amiri',serif"}}>✅ {lang==="ar"?`الإعلان يختفي بعد ${banner.days} يوم`:`Ad disappears after ${banner.days} days`}</p>}
                        {banner.expiresAt&&<p style={{fontSize:12,color:G,marginTop:4,fontFamily:"'Amiri',serif"}}>⏳ {lang==="ar"?"ينتهي في":"Expires"}: {new Date(banner.expiresAt).toLocaleDateString(lang==="ar"?"ar-MA":"fr-FR")}</p>}
                      </div>
                      <div style={{marginBottom:16}}>
                        <label style={{display:"block",fontSize:12,fontWeight:700,color:"#888",marginBottom:5,fontFamily:"'Amiri',serif"}}>{lang==="ar"?"رفع الفيديو":"Upload Video"}</label>
                        <input type="file" accept="video/*" onChange={async(e)=>{
                          const file=e.target.files[0];
                          if(!file)return;
                          const sizeMB=(file.size/1024/1024).toFixed(1);
                          if(file.size>100*1024*1024){notify("❌ "+(lang==="ar"?"الفيديو كبير بزاف (max 100MB)":"Video too large (max 100MB)"));return;}
                          notify(`⏳ ${lang==="ar"?"جاري الرفع...":"Uploading..."} (${sizeMB}MB)`);
                          const fd=new FormData();
                          fd.append("file",file);fd.append("upload_preset","r3uemf9r");fd.append("cloud_name","dcg34jeuy");fd.append("resource_type","video");
                          try{
                            const res=await fetch("https://api.cloudinary.com/v1_1/dcg34jeuy/video/upload",{method:"POST",body:fd});
                            const data=await res.json();
                            if(data.secure_url){setBanner(b=>({...b,videoUrl:data.secure_url}));notify("✅ "+(lang==="ar"?"تم رفع الفيديو!":"Video uploaded!"));}
                            else notify("❌ Error: "+data.error?.message);
                          }catch(err){notify("❌ Upload failed");}
                        }} style={{width:"100%",padding:8,borderRadius:10,border:"1.5px solid #e0d6cc",fontSize:13,background:"#fff",cursor:"pointer"}}/>
                        <p style={{fontSize:11,color:"#aaa",marginTop:4,fontFamily:"'Amiri',serif"}}>{lang==="ar"?"الحجم الأقصى: 100MB — MP4 مستحسن":"Max 100MB — MP4 recommended"}</p>
                      </div>
                      {banner.videoUrl&&<div style={{marginBottom:16,borderRadius:12,overflow:"hidden",border:`1px solid rgba(201,169,110,0.2)`}}>
                        <video src={banner.videoUrl} muted autoPlay loop playsInline style={{width:"100%",maxHeight:180,objectFit:"cover",display:"block"}}/>
                      </div>}
                      <div style={{display:"flex",gap:10}}>
                        <button className="btn-gold" onClick={async()=>{
                          const days=parseInt(banner.days)||0;
                          const expiresAt=days>0?new Date(Date.now()+days*24*60*60*1000).toISOString():null;
                          const data={...banner,expiresAt};
                          await setDoc(doc(db,"settings","banner"),data);
                          setBanner(data);
                          notify("✅ "+(lang==="ar"?"تم الحفظ!":"Saved!"));
                        }} style={{padding:"10px 24px",borderRadius:10,fontSize:14}}>
                          💾 {lang==="ar"?"حفظ":"Save"}
                        </button>
                        {banner.videoUrl&&<button onClick={async()=>{const empty={title:"",videoUrl:"",days:0,expiresAt:null};await setDoc(doc(db,"settings","banner"),empty);setBanner(empty);notify("🗑️ "+(lang==="ar"?"تم الحذف":"Deleted"));}} style={{padding:"10px 18px",borderRadius:10,fontSize:14,background:"transparent",border:"1px solid #e74c3c",color:"#e74c3c",fontWeight:700,cursor:"pointer"}}>
                          🗑️ {lang==="ar"?"حذف":"Delete"}
                        </button>}
                      </div>
                    </div>
                  )}

                  {adminTab==="countdown"&&(
                    <div style={{background:"#faf8f5",borderRadius:16,padding:20,border:"1px solid rgba(201,169,110,0.14)"}}>
                      <h3 style={{fontWeight:700,marginBottom:6,fontSize:15,fontFamily:"'Amiri',serif"}}>⏱️ {lang==="ar"?"عرض محدود / Countdown":"Limited Offer Countdown"}</h3>
                      <p style={{color:"#aaa",fontSize:12,fontFamily:"'Amiri',serif",marginBottom:18}}>{lang==="ar"?"يظهر بانر العداد في الصفحة الرئيسية":"Countdown banner appears on the homepage"}</p>

                      {/* Toggle */}
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                        <span style={{fontWeight:700,fontSize:13,fontFamily:"'Amiri',serif"}}>{lang==="ar"?"تفعيل العرض":"Activate offer"}</span>
                        <div onClick={()=>setCountdown(c=>({...c,active:!c.active}))}
                          style={{width:46,height:26,borderRadius:13,background:countdown.active?G:"#ddd",position:"relative",cursor:"pointer",transition:"background .3s"}}>
                          <div style={{position:"absolute",top:3,left:countdown.active?22:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left .3s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
                        </div>
                        <span style={{fontSize:12,color:countdown.active?"#27ae60":"#aaa",fontWeight:700}}>{countdown.active?(lang==="ar"?"مفعّل":"Active"):(lang==="ar"?"معطّل":"Off")}</span>
                      </div>

                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                        <div style={{gridColumn:"1/-1"}}>
                          <label style={{display:"block",fontSize:11,fontWeight:700,color:"#888",marginBottom:5}}>{lang==="ar"?"عنوان العرض":"Offer Title"}</label>
                          <input value={countdown.title||""} onChange={e=>setCountdown(c=>({...c,title:e.target.value}))}
                            placeholder={lang==="ar"?"مثال: تخفيضات نهاية الموسم":"e.g. End of Season Sale"}
                            style={{width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid #e0d6cc",fontSize:14,outline:"none"}}/>
                        </div>
                        <div style={{gridColumn:"1/-1"}}>
                          <label style={{display:"block",fontSize:11,fontWeight:700,color:"#888",marginBottom:5}}>{lang==="ar"?"نص تحت العنوان (اختياري)":"Subtitle (optional)"}</label>
                          <input value={countdown.subtitle||""} onChange={e=>setCountdown(c=>({...c,subtitle:e.target.value}))}
                            placeholder={lang==="ar"?"مثال: خصم 30% على كل العبايات":"e.g. 30% off all abayas"}
                            style={{width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid #e0d6cc",fontSize:14,outline:"none"}}/>
                        </div>
                        <div style={{gridColumn:"1/-1"}}>
                          <label style={{display:"block",fontSize:11,fontWeight:700,color:"#888",marginBottom:5}}>{lang==="ar"?"تاريخ انتهاء العرض":"Offer end date & time"}</label>
                          <input type="datetime-local" value={countdown.endDate||""} onChange={e=>setCountdown(c=>({...c,endDate:e.target.value}))}
                            style={{width:"100%",padding:"10px 13px",borderRadius:10,border:"1.5px solid #e0d6cc",fontSize:14,outline:"none"}}/>
                        </div>
                      </div>

                      {/* Preview */}
                      {countdown.endDate&&countdown.active&&(
                        <div style={{marginBottom:14,borderRadius:12,overflow:"hidden",border:"1px solid rgba(201,169,110,0.3)"}}>
                          <p style={{background:"rgba(201,169,110,0.1)",padding:"6px 12px",fontSize:11,fontWeight:700,color:"#888"}}>👁️ {lang==="ar"?"معاينة":"Preview"}</p>
                          <CountdownBanner endDate={countdown.endDate} title={countdown.title||"العرض"} subtitle={countdown.subtitle} mob={mob} lang={lang} onShop={()=>{}}/>
                        </div>
                      )}

                      <div style={{display:"flex",gap:10}}>
                        <button className="btn-gold" onClick={async()=>{
                          await setDoc(doc(db,"settings","countdown"),countdown);
                          notify("✅ "+(lang==="ar"?"تم حفظ العرض!":"Countdown saved!"));
                        }} style={{padding:"10px 24px",borderRadius:10,fontSize:14}}>
                          💾 {lang==="ar"?"حفظ":"Save"}
                        </button>
                        <button onClick={async()=>{
                          const off={active:false,title:"",subtitle:"",endDate:""};
                          await setDoc(doc(db,"settings","countdown"),off);
                          setCountdown(off);
                          notify("🗑️ "+(lang==="ar"?"تم الحذف":"Deleted"));
                        }} style={{padding:"10px 18px",borderRadius:10,fontSize:14,background:"transparent",border:"1px solid #e74c3c",color:"#e74c3c",fontWeight:700,cursor:"pointer"}}>
                          🗑️ {lang==="ar"?"إيقاف وحذف":"Stop & Delete"}
                        </button>
                      </div>
                    </div>
                  )}

                  {adminTab==="orders"&&(
                    <div>
                      <h3 style={{fontWeight:700,marginBottom:18,fontSize:16,fontFamily:"'Amiri',serif"}}>📦 {t.viewOrders}</h3>
                      {orders.length===0?(
                        <div style={{textAlign:"center",padding:"46px 0",color:"#ccc"}}><div style={{fontSize:48,marginBottom:13}}>📭</div><p style={{fontWeight:600,fontFamily:"'Amiri',serif",fontSize:17}}>{t.noOrders}</p></div>
                      ):orders.map(o=>(
                        <div key={o.id} style={{background:"#faf8f5",borderRadius:14,padding:16,marginBottom:13,border:`1px solid rgba(201,169,110,0.14)`}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                            <div><p style={{fontWeight:700,fontSize:15,fontFamily:"'Amiri',serif"}}>{o.name}</p><p style={{color:"#aaa",fontSize:13}}>{o.phone}</p><p style={{color:"#ccc",fontSize:11,marginTop:2}}>{new Date(o.date).toLocaleDateString()}</p></div>
                            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                              <p style={{fontWeight:700,fontSize:20,fontFamily:"'Cinzel Decorative',serif",color:G}}>{o.total} DH</p>
                              <div style={{display:"flex",gap:6}}>
                                <a href={`https://wa.me/${o.phone.replace(/\D/g,"")}?text=${encodeURIComponent(`مرحباً ${o.name}، شكراً على طلبك من YLAAF 🛍️`)}`} target="_blank" rel="noreferrer" style={{background:"#25D366",color:"#fff",border:"none",borderRadius:8,padding:"5px 10px",fontWeight:700,fontSize:12,cursor:"pointer",textDecoration:"none",display:"flex",alignItems:"center",gap:5}}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.862L.057 23.998l6.306-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.733.979 1.001-3.64-.234-.374A9.818 9.818 0 1112 21.818z"/></svg>
                                  WhatsApp
                                </a>
                                <button onClick={async()=>{if(window.confirm("حذف الطلب؟"))await deleteDoc(doc(db,"orders",o.id));}} style={{background:"#fff0f0",color:"#e74c3c",border:"1px solid #fdd",borderRadius:8,padding:"5px 10px",fontWeight:700,fontSize:12,cursor:"pointer"}}>حذف</button>
                              </div>
                            </div>
                          </div>
                          {o.items.map((item,i)=>{
                            const img=(item.images&&item.images[0])||item.image;
                            return (
                              <div key={i} style={{display:"flex",gap:10,padding:"7px 0",borderTop:`1px solid rgba(201,169,110,0.1)`}}>
                                <img src={img} alt={item.name} style={{width:42,height:42,borderRadius:7,objectFit:"cover"}}/>
                                <div><p style={{fontWeight:600,fontSize:13,fontFamily:"'Amiri',serif"}}>{item.name}</p><p style={{color:"#aaa",fontSize:12}}>{item.qty} × {item.price} DH</p></div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}

                  {adminTab==="settings"&&(
                    <div style={{display:"flex",flexDirection:"column",gap:18}}>
                      <h3 style={{fontWeight:700,fontSize:15,fontFamily:"'Amiri',serif"}}>⚙️ {lang==="ar"?"إعدادات الموقع":"Site Settings"}</h3>

                      {/* WhatsApp */}
                      <div style={{background:"#faf8f5",borderRadius:16,padding:20,border:"1px solid rgba(201,169,110,0.14)"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                          <div style={{width:40,height:40,borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.862L.057 23.998l6.306-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.733.979 1.001-3.64-.234-.374A9.818 9.818 0 1112 21.818z"/></svg>
                          </div>
                          <div>
                            <p style={{fontWeight:700,fontSize:14,fontFamily:"'Amiri',serif"}}>WhatsApp</p>
                            <p style={{color:"#aaa",fontSize:11,fontFamily:"'Amiri',serif"}}>{lang==="ar"?"رقم الطلبات والتواصل — يتحدث في كل الموقع":"Orders & contact number — updates everywhere"}</p>
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:"1.5px solid #e0d6cc",borderRadius:10,padding:"0 12px",marginBottom:12}}>
                          <span style={{color:"#aaa",fontSize:13,fontWeight:700,fontFamily:"monospace",flexShrink:0}}>+</span>
                          <input
                            value={siteSettings.whatsapp||""}
                            onChange={e=>setSiteSettings(s=>({...s,whatsapp:e.target.value.replace(/\D/g,"")}))}
                            placeholder="212703225198"
                            style={{flex:1,border:"none",outline:"none",padding:"10px 0",fontSize:14,fontFamily:"monospace",background:"transparent"}}
                          />
                        </div>
                        <p style={{color:"#aaa",fontSize:11,fontFamily:"'Amiri',serif",marginBottom:12}}>
                          {lang==="ar"?"مثال: 212703225198 (بدون + أو 00)":"Example: 212703225198 (no + or 00)"}
                        </p>
                        {/* Preview link */}
                        {siteSettings.whatsapp&&(
                          <a href={`https://wa.me/${siteSettings.whatsapp}`} target="_blank" rel="noreferrer"
                            style={{display:"inline-flex",alignItems:"center",gap:6,color:"#25D366",fontSize:12,fontWeight:700,fontFamily:"'Amiri',serif",textDecoration:"none",marginBottom:12}}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            {lang==="ar"?"اختبر الرابط":"Test link"}: wa.me/{siteSettings.whatsapp}
                          </a>
                        )}
                      </div>

                      {/* Instagram */}
                      <div style={{background:"#faf8f5",borderRadius:16,padding:20,border:"1px solid rgba(201,169,110,0.14)"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                          <div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" strokeLinecap="round"/></svg>
                          </div>
                          <div>
                            <p style={{fontWeight:700,fontSize:14,fontFamily:"'Amiri',serif"}}>Instagram</p>
                            <p style={{color:"#aaa",fontSize:11,fontFamily:"'Amiri',serif"}}>{lang==="ar"?"يظهر في section الصور وزر المتابعة":"Appears in gallery section as follow button"}</p>
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:"1.5px solid #e0d6cc",borderRadius:10,padding:"0 12px",marginBottom:12}}>
                          <span style={{color:"#aaa",fontSize:13,fontWeight:700,flexShrink:0}}>@</span>
                          <input
                            value={(siteSettings.instagram||"").replace(/^@|^https?:\/\/(www\.)?instagram\.com\//,"")}
                            onChange={e=>setSiteSettings(s=>({...s,instagram:e.target.value.trim()}))}
                            placeholder="ylaaf.store"
                            style={{flex:1,border:"none",outline:"none",padding:"10px 0",fontSize:14,background:"transparent"}}
                          />
                        </div>
                        {/* Preview */}
                        {siteSettings.instagram&&(
                          <a href={`https://instagram.com/${siteSettings.instagram.replace("@","")}`} target="_blank" rel="noreferrer"
                            style={{display:"inline-flex",alignItems:"center",gap:6,background:"linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontSize:12,fontWeight:700,fontFamily:"'Amiri',serif",textDecoration:"none",marginBottom:12}}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#833ab4" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            instagram.com/{siteSettings.instagram.replace("@","")}
                          </a>
                        )}
                      </div>

                      {/* Save button */}
                      <button className="btn-gold" onClick={async()=>{
                        await setDoc(doc(db,"settings","siteSettings"),siteSettings);
                        notify("✅ "+(lang==="ar"?"تم حفظ الإعدادات! يتحدث كل الموقع الآن 🎉":"Settings saved! Site updated everywhere 🎉"));
                      }} style={{padding:"13px",borderRadius:13,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                        💾 {lang==="ar"?"حفظ الإعدادات":"Save Settings"}
                      </button>
                    </div>
                  )}

                  {adminTab==="subscribers"&&(
                    <div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
                        <div>
                          <h3 style={{fontWeight:700,fontSize:15,fontFamily:"'Amiri',serif"}}>🔔 {lang==="ar"?"المشتركين في الإشعارات":"Notification Subscribers"}</h3>
                          <p style={{color:"#aaa",fontSize:12,fontFamily:"'Amiri',serif",marginTop:4}}>{subscribers.length} {lang==="ar"?"مشترك":"subscribers"}</p>
                        </div>
                        {subscribers.length>0&&(
                          <a href={`https://wa.me/?text=${encodeURIComponent(lang==="ar"?"مرحباً! 👋 عندنا منتجات جديدة في YLAAF 🛍️✨":"Hello! 👋 We have new products at YLAAF 🛍️✨")}`}
                            target="_blank" rel="noreferrer"
                            style={{display:"inline-flex",alignItems:"center",gap:7,background:"#25D366",color:"#fff",padding:"9px 18px",borderRadius:12,fontWeight:700,fontSize:13,fontFamily:"'Amiri',serif",textDecoration:"none"}}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.862L.057 23.998l6.306-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.733.979 1.001-3.64-.234-.374A9.818 9.818 0 1112 21.818z"/></svg>
                            {lang==="ar"?"إرسال إشعار للكل":"Notify All"}
                          </a>
                        )}
                      </div>

                      {subscribers.length===0?(
                        <div style={{textAlign:"center",padding:"46px 0",color:"#ccc"}}>
                          <div style={{fontSize:48,marginBottom:13}}>🔔</div>
                          <p style={{fontWeight:600,fontFamily:"'Amiri',serif",fontSize:16}}>{lang==="ar"?"لا يوجد مشتركين بعد":"No subscribers yet"}</p>
                          <p style={{color:"#aaa",fontSize:13,fontFamily:"'Amiri',serif",marginTop:6}}>{lang==="ar"?"الزبائن يسجلون من أيقونة الجرس في الموقع":"Customers register via the bell icon on the site"}</p>
                        </div>
                      ):(
                        <div style={{display:"flex",flexDirection:"column",gap:10}}>
                          {subscribers.map(s=>(
                            <div key={s.id} style={{background:"#faf8f5",borderRadius:14,padding:"14px 18px",border:"1px solid rgba(201,169,110,0.14)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                              <div style={{display:"flex",alignItems:"center",gap:12}}>
                                <div style={{width:38,height:38,borderRadius:"50%",background:`linear-gradient(135deg,${G},#8b5e3c)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                </div>
                                <div>
                                  <p style={{fontWeight:700,fontSize:14,fontFamily:"monospace",direction:"ltr"}}>+{s.phone}</p>
                                  <p style={{color:"#aaa",fontSize:11,fontFamily:"'Amiri',serif"}}>{new Date(s.date).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div style={{display:"flex",gap:7}}>
                                <a href={`https://wa.me/${s.phone}`} target="_blank" rel="noreferrer"
                                  style={{background:"#25D366",color:"#fff",border:"none",borderRadius:9,padding:"6px 12px",fontWeight:700,fontSize:12,cursor:"pointer",textDecoration:"none",display:"flex",alignItems:"center",gap:5}}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.862L.057 23.998l6.306-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.733.979 1.001-3.64-.234-.374A9.818 9.818 0 1112 21.818z"/></svg>
                                  WhatsApp
                                </a>
                                <button onClick={async()=>{if(window.confirm(lang==="ar"?"حذف المشترك؟":"Delete subscriber?"))await deleteDoc(doc(db,"subscribers",s.id));}} style={{background:"#fff0f0",color:"#e74c3c",border:"1px solid #fdd",borderRadius:9,padding:"6px 10px",fontWeight:700,fontSize:12,cursor:"pointer"}}>🗑️</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ORDER SUCCESS MODAL */}
      {orderDone&&(
        <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(8px)"}} onClick={()=>setOrderDone(false)}/>
          <div style={{position:"relative",background:CARD_BG,borderRadius:28,padding:mob?"32px 24px":"44px 52px",maxWidth:420,width:"100%",textAlign:"center",boxShadow:"0 32px 80px rgba(0,0,0,0.4)",border:`1px solid ${BORDER}`,animation:"scaleIn .4s cubic-bezier(.22,.68,0,1.2)",zIndex:1}}>
            {/* Animated checkmark */}
            <div style={{width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,#27ae60,#1e8449)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:"0 8px 32px rgba(39,174,96,0.4)",animation:"scaleIn .5s .1s cubic-bezier(.22,.68,0,1.2) both"}}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{fontSize:mob?22:28,fontWeight:700,fontFamily:"'Amiri',serif",color:TEXT,marginBottom:10}}>
              {lang==="ar"?"تم إرسال طلبك بنجاح! 🎉":lang==="fr"?"Commande envoyée avec succès! 🎉":"Order sent successfully! 🎉"}
            </h2>
            <p style={{color:night?"rgba(240,235,228,0.5)":"#aaa",fontFamily:"'Amiri',serif",fontSize:mob?13:15,lineHeight:1.8,marginBottom:24}}>
              {lang==="ar"?"شكراً على ثقتك في YLAAF ✨\nسنتواصل معك قريباً لتأكيد الطلب":lang==="fr"?"Merci pour votre confiance en YLAAF ✨\nNous vous contacterons bientôt":"Thank you for trusting YLAAF ✨\nWe'll contact you soon to confirm your order"}
            </p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>{setOrderDone(false);setPage("shop");}} style={{background:`linear-gradient(135deg,${G},#8b5e3c)`,color:"#fff",border:"none",borderRadius:14,padding:"12px 28px",fontWeight:700,fontSize:14,fontFamily:"'Amiri',serif",cursor:"pointer"}}>
                {lang==="ar"?"تسوق أكثر 🛍️":lang==="fr"?"Continuer les achats":"Shop More 🛍️"}
              </button>
              <button onClick={()=>setOrderDone(false)} style={{background:"transparent",color:TEXT,border:`1.5px solid ${BORDER}`,borderRadius:14,padding:"12px 20px",fontWeight:700,fontSize:14,fontFamily:"'Amiri',serif",cursor:"pointer"}}>
                {lang==="ar"?"إغلاق":"Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION BELL MODAL */}
      {notifBellOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div onClick={()=>setNotifBellOpen(false)} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(6px)"}}/>
          <div style={{position:"relative",background:CARD_BG,borderRadius:24,padding:mob?"28px 20px":"36px 40px",width:"100%",maxWidth:420,boxShadow:"0 24px 80px rgba(0,0,0,0.3)",border:`1px solid ${BORDER}`,animation:"scaleIn .3s ease",zIndex:1,textAlign:"center"}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:`linear-gradient(135deg,${G},#8b5e3c)`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            </div>
            <h3 style={{fontSize:mob?20:24,fontWeight:700,fontFamily:"'Amiri',serif",color:TEXT,marginBottom:8}}>
              {lang==="ar"?"كن أول من يعرف! 🔔":lang==="fr"?"Soyez le premier informé! 🔔":"Be the first to know! 🔔"}
            </h3>
            <p style={{color:night?"rgba(240,235,228,0.5)":"#aaa",fontSize:13,fontFamily:"'Amiri',serif",marginBottom:24,lineHeight:1.7}}>
              {lang==="ar"?"سجل رقمك واستقبل إشعاراً على WhatsApp فاش نزيدو منتجات جديدة أو عروض خاصة 🎁":lang==="fr"?"Enregistrez votre numéro et recevez une notification WhatsApp lors de nouveaux produits":"Register your number and get a WhatsApp notification when we add new products or special offers 🎁"}
            </p>
            <div style={{display:"flex",gap:10,marginBottom:14}}>
              <input
                value={bellPhone}
                onChange={e=>setBellPhone(e.target.value.replace(/\D/g,""))}
                placeholder={lang==="ar"?"رقم الهاتف (مثال: 212XXXXXXXXX)":lang==="fr"?"Numéro (ex: 212XXXXXXXXX)":"Phone number (e.g. 212XXXXXXXXX)"}
                style={{flex:1,padding:"12px 14px",borderRadius:12,border:`1.5px solid ${BORDER}`,background:night?"rgba(255,255,255,0.06)":"#fff",color:TEXT,fontSize:14,fontFamily:"'Amiri',serif",outline:"none",direction:"ltr"}}
              />
              <button className="btn-gold" onClick={async()=>{
                if(!bellPhone||bellPhone.length<9){notify("⚠️ "+(lang==="ar"?"أدخل رقم صحيح":"Enter valid number"));return;}
                if(subscribers.find(s=>s.phone===bellPhone)){notify(lang==="ar"?"✅ أنت مسجل بالفعل!":"✅ Already registered!");setNotifBellOpen(false);return;}
                await addDoc(collection(db,"subscribers"),{phone:bellPhone,date:new Date().toISOString()});
                notify("✅ "+(lang==="ar"?"تم التسجيل! سنخبرك بكل جديد 🎉":lang==="fr"?"Inscrit! Nous vous informerons 🎉":"Registered! We'll notify you 🎉"));
                setBellPhone("");setNotifBellOpen(false);
              }} style={{padding:"12px 16px",borderRadius:12,fontSize:13,whiteSpace:"nowrap"}}>
                {lang==="ar"?"سجّل":"OK"}
              </button>
            </div>
            <p style={{color:night?"rgba(240,235,228,0.3)":"#ccc",fontSize:11,fontFamily:"'Amiri',serif"}}>
              {lang==="ar"?"لن نشارك رقمك مع أي جهة أخرى 🔒":"We won't share your number 🔒"}
            </p>
            <button onClick={()=>setNotifBellOpen(false)} style={{position:"absolute",top:16,right:16,background:"none",border:"none",cursor:"pointer",color:"#aaa",fontSize:20,lineHeight:1}}>×</button>
          </div>
        </div>
      )}

      {/* WHATSAPP FLOAT */}
      <a href={`https://wa.me/${siteSettings.whatsapp}`} target="_blank" rel="noreferrer" style={{position:"fixed",bottom:mob?24:32,right:mob?20:32,zIndex:900,background:"#25D366",borderRadius:"50%",width:54,height:54,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(37,211,102,0.45)",transition:"transform .2s",textDecoration:"none"}}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.862L.057 23.998l6.306-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.733.979 1.001-3.64-.234-.374A9.818 9.818 0 1112 21.818z"/></svg>
      </a>

      {/* WISHLIST PAGE */}
      {wishPage&&<div style={{position:"fixed",inset:0,zIndex:2000,background:BG,overflowY:"auto",animation:"fadeUp .3s ease"}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:mob?"80px 16px 40px":"90px 44px 60px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:36}}>
            <div>
              <h2 style={{fontSize:mob?24:34,fontWeight:700,fontFamily:"'Amiri',serif",color:TEXT}}>{lang==="ar"?"قائمة الأمنيات":lang==="fr"?"Liste de souhaits":"Wishlist"}</h2>
              <p style={{color:G,fontSize:13,marginTop:4}}>{wishlist.length} {lang==="ar"?"منتج":lang==="fr"?"article(s)":"item(s)"}</p>
            </div>
            <button onClick={()=>setWishPage(false)} style={{background:"none",border:`1px solid ${BORDER}`,borderRadius:10,padding:"9px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:7,color:TEXT,fontFamily:"'Amiri',serif",fontSize:14}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              {lang==="ar"?"إغلاق":"Close"}
            </button>
          </div>
          {wishlist.length===0
            ? <div style={{textAlign:"center",padding:"80px 0"}}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={BORDER} strokeWidth="1.5" style={{marginBottom:16}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <p style={{color:"#aaa",fontFamily:"'Amiri',serif",fontSize:16}}>{lang==="ar"?"لا توجد منتجات في قائمة الأمنيات":lang==="fr"?"Aucun article":"No items in wishlist"}</p>
              </div>
            : <div className="pgrid"><br/>{wishlist.map(p=><ProductCard key={p.id} product={p} t={t} onAdd={addToCart} onOpenPopup={setPopup} categories={categories} night={night} notify={notify}/>)}</div>
          }
        </div>
      </div>}

      <footer style={{background:DARK,color:"#fff",textAlign:"center",padding:mob?"34px 16px":"52px 44px"}}>
        <div style={{marginBottom:16}}><Logo size="sm" inverted/></div>
        <div style={{display:"flex",justifyContent:"center",gap:28,marginBottom:18,flexWrap:"wrap"}}>
          {["home","shop","about"].map(p=>(
            <span key={p} onClick={()=>setPage(p)} style={{cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:13,fontFamily:"'Amiri',serif",transition:"color .2s",letterSpacing:"0.07em"}}>
              {p==="home"?t.home:p==="shop"?t.shop:t.about}
            </span>
          ))}
        </div>
        {/* Social icons */}
        <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:20}}>
          {siteSettings.instagram&&(
            <a href={`https://instagram.com/${siteSettings.instagram.replace("@","")}`} target="_blank" rel="noreferrer"
              style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none",transition:"transform .2s,box-shadow .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.12)";e.currentTarget.style.boxShadow="0 4px 16px rgba(131,58,180,0.5)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="none";}}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </a>
          )}
        </div>
        <p style={{color:"rgba(201,169,110,0.35)",fontSize:12,fontFamily:"'Amiri',serif",letterSpacing:"0.12em"}}>© 2025 YLAAF Store 🇲🇦</p>
      </footer>
    </div>
  );
}
