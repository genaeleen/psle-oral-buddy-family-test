import {configured,admin,json,method,sameOrigin,parse,authorizedAdmin,token,digest,email} from './_shared.mjs';
export async function handler(event){
 if(!method(event,'POST'))return json(405,{error:'Method not allowed'});
 if(!configured())return json(503,{error:'Server not configured'});
 if(!sameOrigin(event))return json(403,{error:'Origin not allowed'});
 const user=await authorizedAdmin(event);if(!user)return json(403,{error:'Administrator login required'});
 const body=parse(event),recipient=email(body?.email);
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)||recipient.length>254)return json(400,{error:'Valid email required'});
 const db=admin();
 // Do not allow a second active invitation for the same email.
 const {data:existing,error:checkError}=await db.from('parent_invitations').select('id').eq('email',recipient).is('redeemed_at',null).gt('expires_at',new Date().toISOString()).limit(1);
 if(checkError)return json(500,{error:'Unable to check invitations'});
 if(existing?.length)return json(409,{error:'An active invitation already exists for this email'});
 const raw=token(),expires=new Date(Date.now()+48*3600_000).toISOString();
 const {error}=await db.from('parent_invitations').insert({email:recipient,token_hash:digest(raw),expires_at:expires});
 if(error)return json(500,{error:'Unable to create invitation'});
 const base=process.env.PUBLIC_SITE_URL;
 if(!base)return json(503,{error:'PUBLIC_SITE_URL missing. Invitation was stored; configure URL before generating another.'});
 return json(200,{url:`${base.replace(/\/$/,'')}/?invite=${encodeURIComponent(raw)}`,expires_at:expires,email:recipient});
}
