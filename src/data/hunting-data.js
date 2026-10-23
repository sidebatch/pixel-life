// The first hunting ground is a separate, non-aggressive wildlife activity.
const HUNTING_RULES=Object.freeze({regionId:'wildwoodHunt',maxHp:100,leash:10,
  forgetMs:18000,respawnMs:60000,windupMs:600,attackCooldownMs:1500,invulnerableMs:850,hitChance:.6,
  toolDamage:Object.freeze({sword:16,axe:10,sickle:6,rod:4})});
// The ground marker and damage test share one ellipse at the locked aim point.
const HUNTING_ATTACK_AREA=Object.freeze({radiusX:.55,radiusY:.35,feetOffset:20,reach:1.6});
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
const HUNTING_BOSS=Object.freeze({name:'브락',image:'dungeonBrak',hp:320,damage:26,stepMs:430,scale:1.75,
  windupMs:1500,attackCooldownMs:2500,respawnMs:300000});
// Presentation only. Damage, windup and cooldown continue to use HUNTING_RULES.
const HUNTING_ATTACK_MOTION=Object.freeze({strikeStart:.72,recoverMs:260,impactHoldMs:90,
  species:Object.freeze({
    boar:Object.freeze({image:'wildlifeBoarAttack',recoil:8,reach:20,lift:0,squash:.07}),
    deer:Object.freeze({image:'wildlifeDeerAttack',recoil:7,reach:18,lift:0,squash:.05}),
    fox:Object.freeze({image:'wildlifeFoxAttack',recoil:6,reach:17,lift:7,squash:.06}),
    wolf:Object.freeze({image:'wildlifeWolfAttack',recoil:8,reach:21,lift:5,squash:.06}),
    bear:Object.freeze({image:'wildlifeBearAttack',recoil:6,reach:14,lift:2,squash:.04}),
    brak:Object.freeze({image:'brakAttack',recoil:13,reach:30,lift:3,squash:.07})
  })});
