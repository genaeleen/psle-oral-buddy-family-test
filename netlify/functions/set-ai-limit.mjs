import {admin,json,parse} from './_shared.mjs';
import {actor,parentFamily,reject} from './_family.mjs';
export async function handler(event){const bad=reject(event);if(bad)return bad;
 const user=await actor(event);if(!user)return json(401,{error:'Sign in as parent'});
 const familyId=await parentFamily(user.id);if(!familyId)return json(403,{error:'Parent family required'});
 const body=parse(event)||{};const {student_id}=body;const limit=body.daily_limit;
 if(typeof student_id!=='string'||!(/^[0-9a-f-]{36}$/i.test(student_id))||!(limit===null||(Number.isInteger(limit)&&limit>=1&&limit<=1000)))return json(400,{error:'Choose a student and either Unlimited or a daily limit from 1 to 1000.'});
 const db=admin();const {data:student,error:se}=await db.from('students').select('id').eq('id',student_id).eq('family_id',familyId).maybeSingle();
 if(se||!student)return json(403,{error:'Student is not in your family'});
 const {error}=await db.from('student_ai_settings').upsert({student_id,daily_limit:limit,updated_at:new Date().toISOString()},{onConflict:'student_id'});
 return error?json(500,{error:'Could not save AI limit'}):json(200,{ok:true,daily_limit:limit});
}