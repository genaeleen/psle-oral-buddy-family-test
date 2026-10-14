import {json} from './_shared.mjs';
export async function handler(event){
 if(event.httpMethod!=='GET')return json(405,{error:'Method not allowed'});
 const url=process.env.SUPABASE_URL, publishableKey=process.env.SUPABASE_PUBLISHABLE_KEY;
 if(!url||!publishableKey)return json(503,{error:'Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in Netlify environment variables'});
 return json(200,{url,publishableKey});
}
