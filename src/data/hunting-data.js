// The first hunting ground is a separate, non-aggressive wildlife activity.
const HUNTING_RULES=Object.freeze({regionId:'wildwoodHunt',maxHp:100,leash:10,
  forgetMs:18000,respawnMs:60000,windupMs:600,attackCooldownMs:1500,invulnerableMs:850,
  toolDamage:Object.freeze({sword:16,axe:10,sickle:6,rod:4})});
const WILDLIFE_TYPES=Object.freeze({
  boar:Object.freeze({name:'멧돼지',image:'wildlifeBoar',hp:64,damage:12,stepMs:350,scale:.95}),
  deer:Object.freeze({name:'사슴',image:'wildlifeDeer',hp:48,damage:8,stepMs:330,scale:.95}),
  fox:Object.freeze({name:'여우',image:'wildlifeFox',hp:40,damage:7,stepMs:310,scale:.75}),
  wolf:Object.freeze({name:'늑대',image:'wildlifeWolf',hp:80,damage:14,stepMs:330,scale:.95}),
  bear:Object.freeze({name:'곰',image:'wildlifeBear',hp:128,damage:20,stepMs:440,scale:1.2})
});
const HUNTING_SPAWNS=Object.freeze([
  {id:'boar_1',type:'boar',x:20,y:33},{id:'deer_1',type:'deer',x:30,y:33},
  {id:'fox_1',type:'fox',x:41,y:33},{id:'wolf_1',type:'wolf',x:29,y:23},
  {id:'bear_1',type:'bear',x:45,y:23},{id:'boar_2',type:'boar',x:17,y:23},
  {id:'deer_2',type:'deer',x:18,y:13},{id:'fox_2',type:'fox',x:31,y:12},
  {id:'wolf_2',type:'wolf',x:41,y:13},{id:'bear_2',type:'bear',x:52,y:35}
].map(Object.freeze));
