import {publicClient,json,parse} from './_shared.mjs';
import {reject,studentForUser} from './_family.mjs';

// Refresh tokens are opaque. Supabase, not a guessed minimum length, decides
// whether a token is valid. This route is exclusive to the standalone pilot.
export async function handler(event){
 const denied=reject(event);if(denied)return denied;
 const token=parse(event)?.refresh_token;
 if(typeof token!=='string'||!token.trim()||token.length>3000||/\s/.test(token)){
  return json(401,{error:'Please sign in again. Your saved answers are preserved.'});
 }
 try{
  const {data,error}=await publicClient().auth.refreshSession({refresh_token:token});
  if(error||!data?.user?.id||!data?.session?.access_token||!data.session.refresh_token){
   return json(401,{error:'Your session could not be restored. Please sign in again. Your saved answers are preserved.'});
  }
  const linked=await studentForUser(data.user.id),student=linked?.students;
  if(!student?.id)return json(403,{error:'A linked student account is required.'});
  return json(200,{student:{id:student.id,display_name:student.display_name,username:student.username},session:data.session});
 }catch{
  // Never echo provider errors or token values to the browser or logs.
  return json(503,{error:'Session restoration is temporarily unavailable. Please try again. Your saved answers are preserved.'});
 }
}
