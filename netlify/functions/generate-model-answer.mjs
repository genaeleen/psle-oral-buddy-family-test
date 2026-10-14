import {json,parse} from './_shared.mjs';
import {actor,studentForUser,reject} from './_family.mjs';
export async function handler(event){
 const bad=reject(event);if(bad)return bad;
 if(event.httpMethod!=='POST')return json(405,{error:'Method not allowed'});
 const user=await actor(event);
 if(!user||!await studentForUser(user.id))return json(403,{error:'Student sign-in required'});
 if(!process.env.OPENAI_API_KEY)return json(503,{error:'AI is not configured'});
 const b=parse(event)||{};
 if(typeof b.question!=='string'||b.question.length<5||b.question.length>1000)return json(400,{error:'Invalid question'});
 const category=Number(b.category);
 if(![1,2,3].includes(category))return json(400,{error:'Invalid question category'});
 const photo=category===1&&typeof b.photo_data==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(b.photo_data)&&b.photo_data.length<1500000?b.photo_data:null;
 const structure=category===1?'Q1: Response explicitly grounded in visible photo details; Bright Ideas 1, 2, 3 (each with reason and specific example); Apply to Self; clearly labelled fictional Sample Story; Ending.':category===2?'Q2: Direct Response; ONE detailed and coherent clearly labelled fictional Sample Story; Ending. Do NOT force three Bright Ideas.':'Q3: Direct opinion; Bright Ideas 1, 2, 3 (each developed with reason and specific example); Apply to Self; clearly labelled fictional Sample Story; Ending.';
 const details={theme:String(b.theme||'').slice(0,150),question:b.question,category,scene_description:String(b.scene||'').slice(0,500),bright_ideas:Array.isArray(b.bright_ideas)?b.bright_ideas.slice(0,3).map(x=>({idea:String(x.idea||'').slice(0,150)})):[],required_structure:structure};
 const content=photo?[{type:'text',text:JSON.stringify(details)},{type:'image_url',image_url:{url:photo,detail:'low'}}]:JSON.stringify(details);
 try{
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);
  let res;try{res=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',signal:controller.signal,headers:{authorization:'Bearer '+process.env.OPENAI_API_KEY,'content-type':'application/json'},body:JSON.stringify({model:'gpt-4o-mini',temperature:0.35,max_tokens:1500,messages:[{role:'system',content:'You are an expert Singapore primary school English oral practice tutor. Write ONE excellent, directly relevant, age-appropriate model spoken answer to the EXACT supplied question. Follow required structure with clear section labels. Be specific, coherent and natural, not generic. Each reason must truly answer the question and each example must support its reason. For Q1 ground observations in the ACTUAL provided photo; never invent photo details. If no photo is supplied, say visual details cannot be verified and do not invent observations. Never claim a fictional story is the student\'s true experience: label Sample Story. No meta advice, no vague filler, no off-topic sentences. The answer is a practice example, not official PSLE marking. Keep it about 170-260 words.'},{role:'user',content}]})});}finally{clearTimeout(timer)}
  if(!res.ok)return json(502,{error:'AI service returned '+res.status});
  const d=await res.json();const answer=d.choices?.[0]?.message?.content?.trim();
  if(!answer||answer.length<250||d.choices?.[0]?.finish_reason==='length')return json(502,{error:'AI answer was incomplete. Please try again.'});
  return json(200,{answer,generated:true});
 }catch(e){return json(502,{error:'AI generation failed. Please try again.'})}
}
