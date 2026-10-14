import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'node:crypto';
const url = process.env.SUPABASE_URL;
const publishable = process.env.SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
export function configured(){ return Boolean(url && publishable && secret); }
export function admin(){return createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}})}
export function publicClient(){return createClient(url,publishable,{auth:{persistSession:false,autoRefreshToken:false}})}
export function json(status, data){return {statusCode:status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':process.env.ALLOWED_ORIGIN || 'null','vary':'Origin'},body:JSON.stringify(data)}}
export function method(event,expected){return event.httpMethod===expected}
export function sameOrigin(event){const origin=event.headers?.origin;return !origin || origin === process.env.ALLOWED_ORIGIN;}
export function parse(event){try{return JSON.parse(event.body||'{}')}catch{return null}}
export function digest(token){return createHash('sha256').update(token).digest('hex')}
export function token(){return randomBytes(32).toString('base64url')}
export function email(value){return typeof value==='string'?value.trim().toLowerCase():''}
export async function authorizedAdmin(event){
 const bearer=event.headers?.authorization||event.headers?.Authorization||'';
 const jwt=/^Bearer (.+)$/i.exec(bearer)?.[1]; if(!jwt)return null;
 const {data:{user},error}=await publicClient().auth.getUser(jwt);
 if(error||!user||!user.email_confirmed_at)return null;
 const {data, error:dbError}=await admin().from('platform_admins').select('user_id').eq('user_id',user.id).maybeSingle();
 return !dbError&&data?user:null;
}
