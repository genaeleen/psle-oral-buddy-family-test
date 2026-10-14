import {admin,json,parse} from './_shared.mjs';
import {actor,parentFamily,reject} from './_family.mjs';
export async function handler(event){
 const bad=reject(event);if(bad)return bad;
 const user=await actor(event);if(!user?.email_confirmed_at)return json(401,{error:'Parent sign-in required'});
 const familyId=await parentFamily(user.id);if(!familyId)return json(403,{error:'Parent family required'});
 const {student_id,password}=parse(event)||{};
 if(typeof student_id!=='string'||!/^[-0-9a-f]{36}$/i.test(student_id)||typeof password!=='string'||password.length<12||password.length>128)return json(400,{error:'Select a student and enter a new password of 12–128 characters.'});
 const db=admin();const {data:student,error:se}=await db.from('students').select('id').eq('id',student_id).eq('family_id',familyId).maybeSingle();if(se||!student)return json(404,{error:'Student not found in your family'});
 const {data:link,error:le}=await db.from('student_auth').select('auth_user_id').eq('student_id',student.id).maybeSingle();if(le||!link)return json(404,{error:'Student login not found'});
 const {error}=await db.auth.admin.updateUserById(link.auth_user_id,{password});if(error)return json(503,{error:'Password reset failed. Please try again.'});
 return json(200,{ok:true,message:'Password changed. Existing answers were not changed. Sign in again with the new password.'});
}
