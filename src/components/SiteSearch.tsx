import {useId} from 'react';
export function SiteSearch(){
 const id=useId();
 return <form className="searchform" method="get" action="/search/" role="search"><div><label className="screen-reader-text sr-only" htmlFor={id}>Search for:</label><input type="search" name="s" id={id} placeholder="Search …" maxLength={120} required/><button type="submit">Search</button></div></form>;
}
