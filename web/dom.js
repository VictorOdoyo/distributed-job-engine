export function el(tag,attrs={},...children){const n=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(k==='class')n.className=v;else if(k.startsWith('on'))n[k]=v;else if(v!==false&&v!==null&&v!==undefined)n.setAttribute(k,v===true?'':String(v));}for(const child of children.flat())if(child!==null&&child!==undefined)n.append(child instanceof Node?child:document.createTextNode(String(child)));return n;}
export function badge(state){return el('span',{class:'badge '+state},state);}
export function short(id){return id?.slice(0,8)??'—';}
export function age(at){if(at==null)return'—';const seconds=Math.max(0,Math.floor((Date.now()-at)/1000));return seconds<60?seconds+'s ago':seconds<3600?Math.floor(seconds/60)+'m ago':seconds<86400?Math.floor(seconds/3600)+'h ago':Math.floor(seconds/86400)+'d ago';}
export function time(at){return at==null?'—':new Date(at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});}
export function table(headers,rows){return el('table',{},el('thead',{},el('tr',{},headers.map(h=>el('th',{},h)))),el('tbody',{},rows.map(cells=>el('tr',{},cells.map(c=>el('td',{},c))))));}
export function empty(text){return el('div',{class:'empty'},text);}
