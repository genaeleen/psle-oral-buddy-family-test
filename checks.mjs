import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const root='netlify/functions/';
let tests=0;
async function call(file,body,options={}){
 let paid=0,quota=0,payload,inserted;
 const db={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{daily_limit:5},error:null})})}),insert:row=>{inserted=row;return{select:()=>({single:async()=>({data:{id:'test-attempt'},error:null})})}},update:()=>({eq:()=>({eq:async()=>({error:null})})})}),rpc:async()=>{quota++;return{data:options.exhausted?null:1,error:null}}};
 const json=(status,data)=>({statusCode:status,body:JSON.stringify(data)});
 const context=vm.createContext({console,AbortController,setTimeout,clearTimeout,process:{env:{OPENAI_API_KEY:'TEST_ONLY'}},json,parse:e=>JSON.parse(e.body),admin:()=>db,reject:()=>options.originBad?json(403,{error:'Origin not allowed'}):null,actor:async()=>options.signedOut?null:{id:'test'},studentForUser:async()=>({student_id:'student',students:{family_id:'family'}}),fetch:async(url,init)=>{paid++;payload=JSON.parse(init.body);if(options.serviceFails)return{ok:false,status:503};return{ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(file.includes('-ai')?(body.mode==='hints'?{hints:['Offer help politely.','Keep shared spaces clear.','Respect the needs of others.']}:{answer:'Point\n'+('Development. '.repeat(60))+'\nExplanation 1\nExplanation 2\nExplanation 3\nExample / Experience\nReflection\nSummarise'}):{score:72,strengths:['A relevant action.'],improvements:['Develop the reason.'],corrected_text:'Point\nExplanation\nExample\nReflection\nSummarise',explanation:'Test feedback.'})}}]})}}});
 let source=fs.readFileSync(root+file,'utf8').replace(/^import .*;\n/gm,'').replace('export async function handler','async function handler');vm.runInContext(source+'\nglobalThis.runHandler=handler;',context);
 const r=await context.runHandler({httpMethod:'POST',headers:{origin:'https://test.invalid'},body:JSON.stringify(body)});
 return{r,data:JSON.parse(r.body),paid,quota,payload,inserted};
}
const base={mode:'hints',theme:'Public Etiquette & Courtesy',question:'What can you tell from this picture?',category:1,photo_data:'data:image/jpeg;base64,AAAA'};
for(const mode of ['hints','model'])for(const category of [1,2,3]){const x=await call('theme1-pilot-ai.mjs',{...base,mode,category});assert.equal(x.r.statusCode,200);assert.equal(x.paid,1);assert.equal(x.quota,1);tests++;}
for(const options of [{signedOut:true},{originBad:true}]){const x=await call('theme1-pilot-ai.mjs',base,options);assert.equal(x.r.statusCode,403);assert.equal(x.paid,0);tests++;}
let x=await call('theme1-pilot-ai.mjs',{...base,photo_data:null});assert.equal(x.r.statusCode,400);assert.equal(x.paid,0);tests++;
x=await call('theme1-pilot-ai.mjs',base,{exhausted:true});assert.equal(x.r.statusCode,429);assert.equal(x.paid,0);tests++;
x=await call('theme1-pilot-ai.mjs',base,{serviceFails:true});assert.equal(x.r.statusCode,502);tests++;
for(const category of [1,2,3]){x=await call('theme1-pilot-mark.mjs',{theme_id:'Public Etiquette & Courtesy',question_id:'stable-id-not-a-format-number',question_text:'How can we show consideration?',answer_text:'I would offer my seat because he needs it more.',category,photo_data:base.photo_data});assert.equal(x.r.statusCode,200);assert.equal(x.inserted.question_id,'stable-id-not-a-format-number');const expected=['','picture','experience','discussion'][category];assert.equal(JSON.parse(typeof x.payload.messages[1].content==='string'?x.payload.messages[1].content:x.payload.messages[1].content[0].text).question_type,expected);tests++;}
const data=JSON.parse(fs.readFileSync('public/theme1-pilot/content.json'));assert.equal(data.questions.length,9);assert.deepEqual([1,2,3].map(c=>data.questions.filter(q=>q.category===c).length),[3,3,3]);for(const q of data.questions){assert.equal(q.hints.length,3);assert(q.answer.length>1000);if(q.image)assert(fs.existsSync('public/theme1-pilot/'+q.image));}tests++;
console.log(`${tests} checks passed: auth, origin rejection, allowance, picture requirement, both AI modes, all three marking formats, stable IDs, and nine-question assets.`);
