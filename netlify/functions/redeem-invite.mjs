import {configured,admin,json,method,sameOrigin,parse,digest,email} from './_shared.mjs';
export async function handler(event){
 if(!method(event,'POST'))return json(405,{error:'Method not allowed'});
 if(!configured())return json(503,{error:'Server not configured'});
 if(!sameOrigin(event))return json(403,{error:'Origin not allowed'});
 const body=parse(event),raw=body?.token,recipient=email(body?.email),password=body?.password,familyName=body?.family_name;
 if(typeof raw!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(raw)||!recipient||typeof password!=='string'||password.length<12||password.length>128||typeof familyName!=='string'||familyName.trim().length<1||familyName.trim().length>120)return json(400,{error:'Check invitation, email, family name and password (12+ characters)'});
 const db=admin(),hash=digest(raw);
 const {data:invite,error:findError}=await db.from('parent_invitations').select('id,email,expires_at,redeemed_at').eq('token_hash',hash).maybeSingle();
 if(findError||!invite||invite.email!==recipient||invite.redeemed_at||new Date(invite.expires_at)<=new Date())return json(400,{error:'Invalid or expired invitation'});
 // Atomic claim prevents two simultaneous redemptions of the same token.
 const claimedAt=new Date().toISOString();
 const {data:claimed,error:claimError}=await db.from('parent_invitations').update({redeemed_at:claimedAt}).eq('id',invite.id).is('redeemed_at',null).gt('expires_at',claimedAt).select('id').maybeSingle();
 if(claimError||!claimed)return json(409,{error:'Invitation already used or expired'});
 let userId=null, familyId=null;
 try {
  // Email must be verified before the parent can log in.
  const {data:created,error:authError}=await db.auth.admin.createUser({email:recipient,password,email_confirm:false});
  if(authError||!created.user)throw new Error('Account could not be created (email may already be registered)');
  userId=created.user.id;
  const {data:family,error:familyError}=await db.from('families').insert({name:familyName.trim()}).select('id').single();
  if(familyError)throw new Error('Unable to create family');familyId=family.id;
  const {error:memberError}=await db.from('family_members').insert({family_id:familyId,user_id:userId,role:'parent'});
  if(memberError)throw new Error('Unable to attach parent account');
  // Supabase built-in email confirmation. Requires Auth email delivery configured.
  const {error:mailError}=await db.auth.resend({type:'signup',email:recipient,options:{emailRedirectTo:process.env.PUBLIC_SITE_URL}});
  if(mailError)throw new Error('Unable to send confirmation email; check Supabase email settings');
  const {error:markError}=await db.from('parent_invitations').update({redeemed_by:userId}).eq('id',invite.id);
  if(markError)throw new Error('Unable to finalize invitation');
  return json(200,{ok:true,message:'Account created. Check your email to confirm your address before signing in.'});
 }catch(err){
  // Best-effort rollback; invite remains claimed if cleanup fails, requiring admin review.
  if(familyId)await db.from('families').delete().eq('id',familyId);
  if(userId)await db.auth.admin.deleteUser(userId);
  await db.from('parent_invitations').update({redeemed_at:null,redeemed_by:null}).eq('id',invite.id).eq('redeemed_at',claimedAt);
  return json(400,{error:err.message||'Unable to activate invitation'});
 }
}
