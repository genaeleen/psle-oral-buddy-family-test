import {admin,json,parse} from './_shared.mjs';
import {actor,studentForUser,reject} from './_family.mjs';
export async function handler(event){const bad=reject(event);if(bad)return bad;const user=await actor(event);if(!user)return json(401,{error:'Student login required'});
 const linked=await studentForUser(user.id);if(!linked?.students)return json(403,{error:'Student account required'});
 const body=parse(event)||{};const {theme_id,question_id,stimulus_id,answer_text,corrected_text,feedback,score,status,client_attempt_id,content_version}=body;
 if(typeof theme_id!=='string'||theme_id.length>100||!theme_id||typeof question_id!=='string'||!question_id||question_id.length>100||typeof answer_text!=='string'||answer_text.length>30000||!['draft','submitted','marked'].includes(status)|| (score!=null&&(!Number.isFinite(score)||score<0||score>100)))return json(400,{error:'Invalid practice attempt'});
 // Do not accept client-submitted AI scores as verified: marked attempts need server-side AI verification later.
 if(status==='marked'||score!=null||corrected_text!=null||feedback!=null)return json(400,{error:'AI marking records must be written by the trusted marking service, not the browser'});
 const row={family_id:linked.students.family_id,student_id:linked.student_id,theme_id,question_id,stimulus_id:typeof stimulus_id==='string'?stimulus_id.slice(0,100):null,answer_text,status,client_attempt_id:typeof client_attempt_id==='string'?client_attempt_id.slice(0,120):null,content_version:typeof content_version==='string'?content_version.slice(0,60):null};
 const {data,error}=await admin().from('practice_attempts').insert(row).select('id,created_at').single();return error?json(400,{error:'Could not save attempt'}):json(200,{ok:true,attempt:data});
}
