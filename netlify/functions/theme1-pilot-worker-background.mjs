import {context,parse,uuid,chat,hints,model,structure,fixedQuestions,imageURL,conservativeEdit} from './_theme1-pilot.mjs';
async function picture(db,q){if(!q.image&&!q.image_path)return null;const url=q.image_path?await imageURL(db,q):new URL('/theme1-pilot/'+q.image,process.env.DEPLOY_URL||process.env.ALLOWED_ORIGIN).href;const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Picture could not load.');const mime=(r.headers.get('content-type')||'').split(';')[0];if(!['image/png','image/jpeg','image/webp'].includes(mime))throw Error('Picture URL did not return an image. Check preview access.');const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length>10000000)throw Error('Picture too large.');return 'data:'+ mime+';base64,'+bytes.toString('base64');}
export async function handler(event){
 const c=await context(event);if(c.denied)return c.denied;const {db,linked}=c,id=parse(event)?.id;if(!uuid(id))return;
 // Atomic compare-and-set: Netlify retries and duplicate callbacks never repeat paid work.
 const {data:job,error}=await db.from('theme1_pilot_jobs').update({state:'running'}).eq('id',id).eq('student_id',linked.student_id).eq('state','pending').select('*').maybeSingle();if(error||!job)return;
 const usage=[];let imagePath=null;
 try{
  const req=job.request;let result;
  if(['question','image'].includes(job.kind)){
   const fixed=await fixedQuestions(),category=req.category;
   let q=category===1?{...(req.picture||fixed[req.picture_index])}:{category};let image=category===1&&job.kind!=='image'?await picture(db,q):null;
   if(job.kind==='image'){
    const settings=['a Singapore MRT carriage with passengers sharing space and offering a priority seat','a public library with readers and a polite reminder to speak quietly','a hawker centre with diners returning trays and keeping tables clean'];
    const r=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',signal:AbortSignal.timeout(240000),headers:{authorization:'Bearer '+process.env.OPENAI_API_KEY,'content-type':'application/json'},body:JSON.stringify({model:process.env.PILOT_IMAGE_MODEL||'gpt-image-2',size:'1024x1024',quality:'low',n:1,prompt:'Create an original realistic educational oral-practice scene: '+settings[req.picture_index]+'. Generic people in ordinary fully clothed everyday situations. Child-safe, calm, respectful, inclusive. No danger, injury, humiliation, personal information, readable signs or logos. Show both considerate behaviour and a small everyday opportunity to be more thoughtful. Not an examination photograph.'})});
    if(!r.ok)throw Error('Picture service unavailable ('+r.status+').');const d=await r.json();usage.push({image:d.usage||{},created:!!d.data?.[0]?.b64_json});const base64=d.data?.[0]?.b64_json;if(typeof base64!=='string')throw Error('Picture was not returned.');
    const bytes=Buffer.from(base64,'base64');if(!bytes.length||bytes.length>10485760)throw Error('Picture size was invalid.');
    // Generated content is checked before being shown or saved for the child.
    image='data:image/png;base64,'+base64;
    const mod=await fetch('https://api.openai.com/v1/moderations',{method:'POST',signal:AbortSignal.timeout(30000),headers:{authorization:'Bearer '+process.env.OPENAI_API_KEY,'content-type':'application/json'},body:JSON.stringify({model:'omni-moderation-latest',input:[{type:'image_url',image_url:{url:image}}]})});
    if(!mod.ok||(await mod.json()).results?.[0]?.flagged!==false)throw Error('Picture safety check did not pass.');
    imagePath=linked.student_id+'/'+id+'.png';const uploaded=await db.storage.from('theme1-pilot-private').upload(imagePath,bytes,{contentType:'image/png',upsert:false});if(uploaded.error)throw Error('Picture could not be saved.');q={category:1,image_path:imagePath};
   }
   const previous=await db.from('theme1_pilot_jobs').select('result').eq('student_id',linked.student_id).in('kind',['question','image']).eq('state','succeeded').order('created_at',{ascending:false}).limit(20);
   const d=await chat('Create one varied Public Etiquette and Courtesy PSLE oral practice question. Return JSON {question:string,hints:[three strings],scene:string}. Each hint is a substantive idea plus its explanation, 12–35 words. Picture: inspect the actual image, ground question and scene only in visible evidence; distinguish inferences. Experience: invite one coherent firsthand story. Discussion: vary how, why and what formulations. Child-safe everyday topics only.',{category,avoid:(previous.data||[]).map(x=>x.result?.question?.question),format:structure(category)},image,usage);
   if(typeof d.question!=='string'||d.question.length<15||d.question.length>300||typeof d.scene!=='string'||d.scene.length>1000)throw Error('Question was incomplete.');
   const normalise=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
   if([...fixed,...(previous.data||[]).map(x=>x.result?.question).filter(Boolean)].some(old=>normalise(old.question)===normalise(d.question)))throw Error('AI repeated a saved question. Try a different category or reuse the saved question.');
   result={question:{id:'ai-'+id,category,question:d.question,hints:hints(d.hints),scene:category===1?d.scene:'',status:'AI-generated draft',...(category===1?(imagePath||q.image_path?{image_path:imagePath||q.image_path}:{image:q.image}):{})}};
  }else{
   const q=req.question,image=q.category===1?await picture(db,q):null;
   const payload={question:q.question,category:q.category,structure:structure(q.category),student_answer:req.answer,hints:q.hints};
   if(job.kind==='hints'){const d=await chat('Return JSON {hints:[exactly three strings]}. Each Speaking Hint has an idea and a helpful explanation, 12–35 words. For experience questions give story-building prompts. Inspect actual image for picture questions.',payload,image,usage);result={hints:hints(d.hints)};}
   else if(['model','alternative'].includes(job.kind)){
    const d=await chat('Return JSON {answer:string}. Write a complete strong P6 oral model answer of 300–420 words using plain labelled headings on separate lines, with blank lines between sections and no Markdown bold markers. Develop thoughts, feelings, actions and reflection in detail. Picture and discussion: three developed explanations AND Apply to Self, Personal Experience, Reflection. Experience: one coherent story. Any fictional first-person experience must be labelled Illustrative sample. Inspect picture, never invent visible details.',payload,image,usage);let complete;
    try{complete=model(d.answer,q.category);}catch{
     const repair=await chat('Return JSON {answer:string}. The previous teaching answer was incomplete or too brief. Write 300–420 words, with plain labelled headings on separate lines and blank lines between sections. Develop specific actions, thoughts, feelings and reflection rather than repeating general advice. Follow the supplied structure; for experience questions develop ONE coherent story. Label any invented experience Illustrative sample. Do not invent unseen image details.',payload,image,usage);
     complete=model(repair.answer,q.category);
    }
    result={answer:complete};
   }else{
    const d=await chat('Assess ONLY the original student answer. Return JSON {score:integer 0–100,strengths:[strings],improvements:[strings],edited_answer:string,corrected_text:string,explanation:string,key_ideas:[three strings]}. Score is unofficial text-only practice, no pronunciation or delivery. edited_answer: lightly correct grammar, spelling and phrasing while preserving all student facts and story; NEVER add new ideas or a rewritten story here. corrected_text: separate high-scoring 300–450 word teaching example with the labelled supplied structure. Put each plain heading on its own line and separate sections with blank lines; do not compress it into one paragraph. Develop concrete actions, personal thoughts, feelings and reflection; label invented stories illustrative. explanation: why the teaching example scores higher. key_ideas: three concrete transferable ideas. Inspect image for picture questions.',payload,image,usage);
    const list=x=>Array.isArray(x)?x.filter(v=>typeof v==='string'&&v.trim()).slice(0,6).map(v=>v.slice(0,1500)):[];
    if(!Number.isInteger(d.score)||d.score<0||d.score>100)throw Error('A usable marking score was not returned.');
    let edited=d.edited_answer,corrected='',warning=[];
    if(!conservativeEdit(req.answer,edited)){
     try{const repair=await chat('Return JSON {edited_answer:string}. Only correct grammar, spelling and phrasing of the student answer. Preserve the pupil’s ideas, facts and story. No added arguments or invented experiences.',{student_answer:req.answer},null,usage);edited=repair.edited_answer;}catch{edited='';}
    }
    if(!conservativeEdit(req.answer,edited)){edited='';warning.push('Lightly edited tracked corrections were unavailable. Your original answer is preserved.');}
    try{corrected=model(d.corrected_text,q.category);}catch{
     try{const repair=await chat('Return JSON {answer:string}. Write a complete high-scoring Primary 6 oral teaching example of 300–420 words with the supplied labelled structure. Use plain headings on separate lines and blank lines between sections. Develop detailed actions, thoughts, feelings and reflection, not a brief outline. Inspect the picture if present. Label any invented experience Illustrative sample.',payload,image,usage);corrected=model(repair.answer,q.category);}catch{warning.push('The high-scoring teaching answer was unavailable. Your score and feedback are saved.');}
    }
    let ideas;try{ideas=hints(d.key_ideas);}catch{ideas=['Answer the exact question and connect each idea to it.','Develop a specific example and explain why the action matters.',q.category===2?'Reflect on what you learnt from one coherent experience.':'Include what you would do, a relevant experience and what you learnt.'];}
    result={original_answer:req.answer,score:d.score,corrected_text:corrected,complete:warning.length===0,feedback:{strengths:list(d.strengths),improvements:list(d.improvements),edited_answer:edited,explanation:typeof d.explanation==='string'?d.explanation.slice(0,3000):'Use the feedback to identify ideas to develop in your next original answer.',key_ideas:ideas,warning:warning.join(' '),question_type:['','picture','experience','discussion'][q.category],rubric:'Unofficial text-only practice score. Delivery and pronunciation are not assessed.'},theme:'Public Etiquette & Courtesy',category:q.category};
   }
  }
  const {error:saveError}=await db.from('theme1_pilot_jobs').update({state:'succeeded',result,provider_usage:usage,finished_at:new Date().toISOString(),request:{}}).eq('id',id).eq('student_id',linked.student_id).eq('state','running');if(saveError)throw Error('AI result could not be saved.');
 }catch(e){
  if(imagePath)await db.storage.from('theme1-pilot-private').remove([imagePath]);
  await db.from('theme1_pilot_jobs').update({state:'failed',error:String(e.message).slice(0,220)+ ' No practice allowance used.',provider_usage:usage,finished_at:new Date().toISOString()}).eq('id',id).eq('student_id',linked.student_id).eq('state','running');
 }
}
