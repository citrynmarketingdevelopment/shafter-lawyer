'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import Image from 'next/image';
export function SiteInteractions({children}:{children:ReactNode}){
 const root=useRef<HTMLDivElement>(null),dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLElement|null>(null);
 const [photo,setPhoto]=useState({src:'',alt:''});
 useEffect(()=>{
  const el=root.current;if(!el)return;
  // Rebuild mobile navigation without retaining any builder script.
  const buttons=el.querySelectorAll<HTMLButtonElement>('.mobile_menu_bar');
  buttons.forEach((button,i)=>{
   const container=button.closest('.mobile_nav')||button.parentElement;if(!container)return;
   let menu=container.querySelector<HTMLUListElement>('.et_mobile_menu');
   if(!menu){const desktop=button.closest('header')?.querySelector('nav ul')||el.querySelector('#top-menu');if(!desktop)return;menu=desktop.cloneNode(true) as HTMLUListElement;menu.className='et_mobile_menu';container.append(menu)}
   menu.id=`native-mobile-menu-${i}`;menu.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));menu.setAttribute('aria-label','Mobile navigation');button.setAttribute('aria-controls',menu.id);
  });
  function closeMenus(){buttons.forEach(b=>{b.setAttribute('aria-expanded','false');b.closest('.mobile_nav')?.classList.remove('opened');b.closest('.mobile_nav')?.classList.add('closed')})}
  function click(event:MouseEvent){
   const target=event.target as HTMLElement,button=target.closest<HTMLButtonElement>('.mobile_menu_bar');
   if(button){const open=button.getAttribute('aria-expanded')!=='true';closeMenus();button.setAttribute('aria-expanded',String(open));button.closest('.mobile_nav')?.classList.toggle('opened',open);button.closest('.mobile_nav')?.classList.toggle('closed',!open);return}
   const link=target.closest<HTMLAnchorElement>('a');
   if(link?.getAttribute('href')?.match(/^\/assets\/.*\.(png|jpe?g|webp|gif)$/i)&&link.querySelector('img')){event.preventDefault();opener.current=link;setPhoto({src:link.getAttribute('href')!,alt:link.querySelector('img')?.alt||'Photo'});dialog.current?.showModal();return}
   if(!target.closest('.mobile_nav'))closeMenus();
  }
  function key(event:KeyboardEvent){if(event.key==='Escape'){closeMenus();dialog.current?.close();opener.current?.focus()}}
  el.addEventListener('click',click);document.addEventListener('keydown',key);
  // Native scroll-driven backgrounds reproduce the original parallax without jQuery.
  const backgrounds=[...el.querySelectorAll<HTMLElement>('.et_parallax_bg')];
  let frame=0;
  function updateBackgrounds(){frame=0;for(const bg of backgrounds){const section=bg.parentElement;if(!section)continue;const rect=section.getBoundingClientRect();if(!rect.width)continue;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;const extra=!reduced?window.innerHeight*.3:0;bg.style.height=(rect.height+extra)+'px';bg.style.transform=extra?'translateY('+((window.innerHeight-rect.top)*.3)+'px)':'none'}}
  function schedule(){if(!frame)frame=requestAnimationFrame(updateBackgrounds)}
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);updateBackgrounds();
  return()=>{el.removeEventListener('click',click);document.removeEventListener('keydown',key);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);cancelAnimationFrame(frame)};
 },[]);
 return <div ref={root}>{children}<dialog className="native-lightbox" ref={dialog} aria-label="Image preview" onClose={()=>opener.current?.focus()} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close()}}><button type="button" onClick={()=>dialog.current?.close()} aria-label="Close image preview">×</button>{photo.src&&<Image src={photo.src} alt={photo.alt} width={1600} height={1200} style={{objectFit:'contain',height:'auto'}}/>}</dialog></div>
}
export function ImageSlider({children,className,id}:{children:ReactNode;className:string;id?:string}){
 const root=useRef<HTMLDivElement>(null),[index,setIndex]=useState(0),[total,setTotal]=useState(0);
 const gallery=className.includes('et_pb_gallery');
 useEffect(()=>{const slides=root.current?.querySelectorAll<HTMLElement>(gallery?'.et_pb_gallery_item':'.et_pb_slide');if(!slides)return;setTotal(slides.length);slides.forEach((s,i)=>{s.style.display=i===index?'block':'none';s.setAttribute('aria-hidden',String(i!==index));s.classList.toggle('et-pb-active-slide',i===index)})},[index,gallery]);
 return <div ref={root} className={`${className} native-slider`} id={id} role="region" aria-roledescription="carousel" aria-label="Photo gallery">{children}{total>1&&<div className="native-slider-controls"><button type="button" aria-label="Previous image" onClick={()=>setIndex((index-1+total)%total)}>‹</button><span aria-live="polite">{index+1} / {total}</span><button type="button" aria-label="Next image" onClick={()=>setIndex((index+1)%total)}>›</button></div>}</div>
}
export function BeforeAfter({before,after}:{before:string;after:string}){
 const [value,setValue]=useState(50);
 return <figure className="native-comparison"><div className="comparison-images"><Image src={after} alt="Completed renovation" width={1200} height={900}/><div style={{clipPath:`inset(0 ${100-value}% 0 0)`}}><Image src={before} alt="Property before renovation" width={1200} height={900}/></div><span className="comparison-before">Before</span><span className="comparison-after">After</span></div><label>Compare before and after<input type="range" min="0" max="100" value={value} onChange={e=>setValue(Number(e.target.value))}/></label></figure>
}
