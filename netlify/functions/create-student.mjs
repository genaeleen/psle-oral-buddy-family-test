import {admin,json,parse} from './_shared.mjs';
import {actor,parentFamily,reject} from './_family.mjs';
import {randomUUID} from 'node:crypto';
export async function handler(event){const bad=reject(event);if(bad)return bad;
 const user=await actor(event);if(!user||!user.email_confirmed_at)return json(401,{error:'Parent login required'});
 const familyId=await parentFamily(user.id);if(!familyId)return json(403,{error:'Parent family not found. An administrator without a family must first activate a parent family account.'});
 const body=parse(event)||{},name=String(body.display_name||'').trim(),username=String(body.username||'').trim().toLowerCase(),password=body.password;
 if(name.length<1||name.length>80||!/^[a-z0-9_]{4,32}$/.test(username)||typeof password!=='string'||password.length<12||password.length>128)return json(400,{error:'Name (1–80), username (4–32 lowercase letters/numbers/_), password (12+ characters) required'});
 const db=admin();const {data:existing}=await db.from('students').select('id').eq('username',username).maybeSingle();if(existing)return json(409,{error:'Username already taken'});
 // Synthetic internal email is never sent to a student. Student signs in via server username mapping.
 const synthetic=`student-${randomUUID()}@accounts.psleoralbuddy.invalid`;
 const {data:created,error:authError}=await db.auth.admin.createUser({email:synthetic,password,email_confirm:true});if(authError||!created?.user)return json(400,{error:'Could not create student account'});
 let studentId=null;
 try{const {data:student,error:studentError}=await db.from('students').insert({family_id:familyId,display_name:name,username}).select('id,display_name,username').single();if(studentError)throw Error(studentError.code==='23505'?'Username already taken':'Unable to create student profile');studentId=student.id;
 const {error:linkError}=await db.from('student_auth').insert({student_id:studentId,auth_user_id:created.user.id});if(linkError)throw Error('Unable to link student login');return json(200,{ok:true,student});
 }catch(e){if(studentId)await db.from('students').delete().eq('id',studentId);await db.auth.admin.deleteUser(created.user.id);return json(400,{error:e.message});}
}
