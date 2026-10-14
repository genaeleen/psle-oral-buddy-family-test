import {publicClient,json,parse} from './_shared.mjs';
import {reject,studentForUser} from './_family.mjs';
export async function handler(event){
 const bad=reject(event);if(bad)return bad;
 const token=parse(event)?.refresh_token;
 if(typeof token!=='string'||token.length<20||token.length>3000)return json(401,{error:'Session expired. Please sign in again.'});
 try{
  const client=publicClient();
  const {data,error}=await client.auth.refreshSession({refresh_token:token});
  if(error||!data?.session?.access_token||!data?.user)return json(401,{error:'Session expired. Please sign in again.'});
  const link=await studentForUser(data.user.id);
  const student=link?.students;
  if(!student?.id)return json(403,{error:'Student account required'});
  return json(200,{student:{id:student.id,display_name:student.display_name,username:student.username},session:data.session});
 }catch(e){return json(401,{error:'Could not restore session. Please sign in again.'})}
}
