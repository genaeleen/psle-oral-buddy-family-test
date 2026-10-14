import {admin,publicClient,json,parse} from './_shared.mjs';
import {reject} from './_family.mjs';
export async function handler(event){const bad=reject(event);if(bad)return bad;const body=parse(event)||{},username=String(body.username||'').trim().toLowerCase(),password=body.password;
 if(!/^[a-z0-9_]{4,32}$/.test(username)||typeof password!=='string')return json(401,{error:'Invalid username or password'});
 const db=admin();const {data:student}=await db.from('students').select('id,display_name,username').eq('username',username).maybeSingle();if(!student)return json(401,{error:'Invalid username or password'});
 const {data:link}=await db.from('student_auth').select('auth_user_id').eq('student_id',student.id).maybeSingle();if(!link)return json(401,{error:'Invalid username or password'});
 const {data:auth}=await db.auth.admin.getUserById(link.auth_user_id);if(!auth?.user?.email)return json(401,{error:'Invalid username or password'});
 const {data:session,error}=await publicClient().auth.signInWithPassword({email:auth.user.email,password});if(error||!session?.session)return json(401,{error:'Invalid username or password'});
 return json(200,{ok:true,student,session:session.session});
}
