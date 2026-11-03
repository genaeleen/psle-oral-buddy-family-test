import {context,json,parse,uuid,resolveQuestion,imageURL} from './_theme1-pilot.mjs';
export async function handler(event){
 const c=await context(event);if(c.denied)return c.denied;const {db,linked}=c,sid=linked.student_id,b=parse(event)||{};
 try{
  if(b.action==='state'){
   if(b.before&&(typeof b.before!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(b.before)||!Number.isFinite(Date.parse(b.before))||!uuid(b.before_id)))return json(400,{error:'Invalid history cursor'});
   let query=db.from('theme1_pilot_jobs').select('id,kind,question_id,state,result,error,created_at').eq('student_id',sid).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(50);
   if(b.before){const before=b.before; // Preserve PostgreSQL microseconds; Date would truncate them.
    query=query.or('created_at.lt.'+before+',and(created_at.eq.'+before+',id.lt.'+b.before_id+')');}
   const [jobs,drafts]=await Promise.all([query,b.before?Promise.resolve({data:[],error:null}):db.from('theme1_pilot_drafts').select('question_id,answer,revision,updated_at').eq('student_id',sid).order('question_id',{ascending:true}).limit(50)]);
   if(jobs.error||drafts.error)throw Error('Pilot storage unavailable. Apply the Theme 1 migration.');
   await Promise.all(jobs.data.map(async j=>{if(j.result?.question?.image_path)j.result.question.image=await imageURL(db,j.result.question);}));
   return json(200,{jobs:jobs.data,drafts:drafts.data,next_cursor:jobs.data.length===50?{before:jobs.data.at(-1).created_at,before_id:jobs.data.at(-1).id}:null,next_draft_cursor:drafts.data.length===50?drafts.data.at(-1).question_id:null});
  }
  if(b.action==='drafts'){
   if(typeof b.after!=='string'||!/^[a-z0-9-]{1,100}$/.test(b.after))return json(400,{error:'Invalid draft cursor'});
   const {data,error}=await db.from('theme1_pilot_drafts').select('question_id,answer,revision,updated_at').eq('student_id',sid).gt('question_id',b.after).order('question_id',{ascending:true}).limit(50);
   if(error)throw Error('Draft history unavailable.');return json(200,{drafts:data,next_draft_cursor:data.length===50?data.at(-1).question_id:null});
  }
  if(b.action==='read-draft'){
   await resolveQuestion(db,sid,b.question_id);
   const {data,error}=await db.from('theme1_pilot_drafts').select('question_id,answer,revision,updated_at').eq('student_id',sid).eq('question_id',b.question_id).maybeSingle();
   if(error)throw Error('Saved draft unavailable.');return json(200,{draft:data});
  }
  if(b.action==='draft'){
   await resolveQuestion(db,sid,b.question_id);
   if(typeof b.answer!=='string'||b.answer.length>6000||!Number.isInteger(b.revision)||b.revision<0)return json(400,{error:'Invalid draft'});
   const {data,error}=await db.rpc('theme1_pilot_save_draft',{p_student:sid,p_question:b.question_id,p_answer:b.answer,p_revision:b.revision});if(error)throw Error('Draft could not be saved.');return json(data?.conflict?409:200,data?.conflict?{...data,error:'This draft changed on another device. Your local text is preserved. Reload saved work before replacing it.'}:data);
  }
  if(b.action==='job'){
   if(!uuid(b.id))return json(400,{error:'Invalid request identifier'});
   const {data,error}=await db.from('theme1_pilot_jobs').select('id,kind,state,result,error,created_at').eq('student_id',sid).eq('id',b.id).maybeSingle();if(error||!data)return json(404,{error:'Request not found'});
   if(['running','pending'].includes(data.state)&&Date.now()-Date.parse(data.created_at)>720000){await db.from('theme1_pilot_jobs').update({state:'failed',error:'Request timed out. No practice allowance used.',finished_at:new Date().toISOString()}).eq('id',b.id).in('state',['running','pending']);data.state='failed';data.error='Request timed out. No practice allowance used.';}
   if(data.result?.question?.image_path)data.result.question.image=await imageURL(db,data.result.question);return json(200,data);
  }
  if(b.action!=='start'||!uuid(b.id)||!['question','image','hints','model','alternative','mark'].includes(b.kind))return json(400,{error:'Invalid pilot action'});
  if(!process.env.OPENAI_API_KEY)return json(503,{error:'AI is not configured.'});
  let request={},qid=b.question_id;
  if(['question','image'].includes(b.kind)){
   const category=Number(b.category);if(![1,2,3].includes(category)||(b.kind==='image'&&category!==1))return json(400,{error:'Invalid question category'});
   request={category,picture_index:Math.abs(Number.isInteger(b.picture_index)?b.picture_index:0)%3};
   if(b.kind==='question'&&category===1&&b.picture_question_id){
    const picture=await resolveQuestion(db,sid,b.picture_question_id);
    if(picture.category!==1||(!picture.image&&!picture.image_path))return json(400,{error:'Choose a saved picture question to reuse.'});
    request.picture={category:1,image:picture.image,image_path:picture.image_path,scene:picture.scene};
   }
   qid='ai-'+b.id;
  }else{
   const q=await resolveQuestion(db,sid,qid);request={question:q};
   if(b.kind==='mark'){if(typeof b.answer!=='string'||!b.answer.trim()||b.answer.length>6000)return json(400,{error:'Enter an answer of 1–6,000 characters.'});request.answer=b.answer;request.family_id=linked.students.family_id;}
  }
  const origin=process.env.DEPLOY_URL||process.env.ALLOWED_ORIGIN;
  let callback;try{callback=new URL('/.netlify/functions/theme1-pilot-worker-background',origin);if(callback.protocol!=='https:'||callback.username||callback.password)throw Error();}catch{throw Error('Preview deployment URL is not configured.');}
  const {data,error}=await db.rpc('theme1_pilot_reserve',{p_student:sid,p_id:b.id,p_kind:b.kind,p_question:qid,p_request:request});
  if(error)throw Error('Pilot allowance unavailable. Apply the Theme 1 migration.');if(data.error)return json(429,data);
  if(data.start){
   // Only a trusted deployment URL; never derive the callback host from request headers.
   try{const r=await fetch(callback,{method:'POST',signal:AbortSignal.timeout(12000),headers:{'content-type':'application/json',authorization:event.headers?.authorization||event.headers?.Authorization||''},body:JSON.stringify({id:data.job_id})});if(r.status!==202)throw Error('Background processing unavailable.');}
   catch(e){
    // A timed-out acknowledgement does not prove the worker failed to start.
    // Only cancel a job that is still pending; otherwise return its identifier
    // so the browser polls the same operation rather than paying for another.
    const cancelled=await db.from('theme1_pilot_jobs').update({state:'failed',error:'Could not start AI processing. No practice allowance used.',finished_at:new Date().toISOString()}).eq('id',data.job_id).eq('student_id',sid).eq('state','pending').select('id').maybeSingle();
    if(cancelled.error||!cancelled.data)return json(200,{job_id:data.job_id,state:'running'});
    throw e;
   }
  }
  return json(200,data);
 }catch(e){return json(503,{error:String(e.message).slice(0,220)});}
}
