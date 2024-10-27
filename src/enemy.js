class Enemy{
    constructor(scene,position){
        this.tag="enemy";
        this.scene=scene;
        this.texturePath = 'res/enemy.png';
         this.meshInfo=[[[0.5,0],[0,0.7],[1,0.7]],
         [[0.5,1],[0,0.7],[1,0.7]]];

        this.health=3;
        this.power=0.3;// 当前功率
        //this.maxPower=5;// 最大功率
        this.shootTimeCnt=40;
        this.shootInterval=170;// 射击时间间隔
        this.bulletSpeed=1;// 子弹速度
        this.powerUpSpeed=0.05;// 功率提升速度
        this.kFriction=0.01;// 摩擦系数
        this.headToTail=128;// 头尾控制点距离 与机体旋转的丝滑程度有关
        this.headpoint={
            position:{x:0,y:0},
            velocity:{x:0,y:0},
            acceleration:{x:0,y:0}}// 头部控制点物理
        this.tailpoint={position:{x:0,y:0}}// 尾部控制点  
        this.updateBound=this.update.bind(this);
        this.headpoint.position.x = position.x;
        this.headpoint.position.y = position.y;
        this.tailpoint.position.x = position.x;
        this.tailpoint.position.y = position.y+1;
        this.init();
    }
    async init() {
        this.texture = await PIXI.Assets.load(this.texturePath);
        this.createSprite();
        this.scene.app.ticker.add(this.updateBound);
        this.hitbox=new Hitbox(this.scene.app,this.sprite,this.tag,this.meshInfo);
        this.scene.hitboxManager.add(this.hitbox);
        this.scene.enemyList.push(this);
    }
    destroy() {
        this.scene.app.stage.removeChild(this.sprite);
        this.scene.app.ticker.remove(this.updateBound);
        this.hitbox.destroy();
        this.scene.enemyList=this.scene.enemyList.filter(item => item !== this);
    }
    createSprite() {
        this.sprite = PIXI.Sprite.from(this.texture);
        this.sprite.anchor.set(0.5,0);
        this.sprite.scale.set(1.25);
        
        this.sprite.rotation=0;
        this.scene.app.stage.addChild(this.sprite);
    }
    accelerationControl() {
        
        this.headpoint.acceleration.x=0;
        this.headpoint.acceleration.y=0;
        const x = this.scene.player.headpoint.position.x;
        const y = this.scene.player.headpoint.position.y;
        const deltaX=x-this.headpoint.position.x;
        const deltaY=y-this.headpoint.position.y;
        const distance=Math.sqrt(deltaX**2+deltaY**2);
        const acceleration=this.power/(Math.abs(this.headpoint.velocity.y)+1);
        this.headpoint.acceleration.y = deltaY/distance*acceleration;
        this.headpoint.acceleration.x = deltaX/distance*acceleration;
        this.headpoint.acceleration.x-=this.kFriction*this.headpoint.velocity.x**3;
        this.headpoint.acceleration.y-=this.kFriction*this.headpoint.velocity.y**3;
    }
    poseControl() {
        const deltaX=this.headpoint.position.x-this.tailpoint.position.x;
        const deltaY=this.headpoint.position.y-this.tailpoint.position.y;
        // 尾部控制点
        const distance=Math.sqrt(deltaX**2+deltaY**2);
        this.tailpoint.position.x=this.headpoint.position.x-deltaX/distance*this.headToTail;
        this.tailpoint.position.y=this.headpoint.position.y-deltaY/distance*this.headToTail;
        // 根据头部和尾部控制点相对位置控制旋转  
        if(deltaY===0 && deltaX!==0) this.sprite.rotation=Math.PI/2*Math.sign(deltaX);
        else if(deltaY!=0) this.sprite.rotation=Math.atan(-deltaX/deltaY)+0.5*Math.PI*(1+Math.sign(deltaY));
    }
    shoot(time){
        this.shootTimeCnt+=time.deltaTime;
        if(this.shootTimeCnt>=this.shootInterval){
            const audio=new Audio("res/enemy_shoot.wav");
            audio.play();
            const x = this.scene.player.headpoint.position.x;
            const y = this.scene.player.headpoint.position.y;
            const deltaX=x-this.headpoint.position.x;
            const deltaY=y-this.headpoint.position.y;
            const distance=Math.sqrt(deltaX**2+deltaY**2);
            const bulletVelX=deltaX/distance*this.bulletSpeed;
            const bulletVelY=deltaY/distance*this.bulletSpeed;
            const bullets=new RoundBulletGroup(this.scene,
                {x:this.headpoint.position.x,y:this.headpoint.position.y},
                {x:bulletVelX,y:bulletVelY},2,8,"enemy_bullet","res/bullet2.png");
            this.shootTimeCnt=0;
        }
    }
    hit(){
        if(this.hitbox.hit===true){
            this.scene.scoreDisplay.score++;
            // console.log(this.hitbox.hitBy);
            const audio=new Audio("res/enemy_hit.wav");
                audio.play();
            if(this.hitbox.hitBy.includes("player")){
                this.hitbox.hit=false;
                this.hitbox.hitBy=[];
                this.destroy();
            }
            else{    
                this.health--;
                this.hitbox.hit=false;
                this.hitbox.hitBy=[];
            }
        }
        if(this.health<=0){
            this.destroy();
        }
    }
    update(time) {
        this.hit();
        this.shoot(time);
        this.accelerationControl()
        // 位移和速度控制
        this.headpoint.velocity.x=Math.min(Math.abs(this.headpoint.velocity.x),20)*Math.sign(this.headpoint.velocity.x);
        this.headpoint.velocity.y=Math.min(Math.abs(this.headpoint.velocity.y),20)*Math.sign(this.headpoint.velocity.y);
        this.headpoint.position.x += this.headpoint.velocity.x*time.deltaTime;
        this.headpoint.position.y += this.headpoint.velocity.y*time.deltaTime;
        this.headpoint.velocity.x += this.headpoint.acceleration.x*time.deltaTime;
        this.headpoint.velocity.y += this.headpoint.acceleration.y*time.deltaTime;
        // 贴图位置在头部控制点
        this.sprite.x=this.headpoint.position.x;
        this.sprite.y=this.headpoint.position.y;
        // 姿态控制 （尾部控制点、旋转
        this.poseControl();
    }
}
class Incubator{
    constructor(scene){
        this.scene=scene;
        this.spawnInterval=73; // 生成敌人的时间间隔
        this.margin=100; // 生成敌人的环绕线距离屏幕的距离
        this.spawnTimeCnt=0; 
        this.totalTimeCnt=0;
        this.updateBound=this.update.bind(this);
        this.init();
    }
    init(){
        this.scene.app.ticker.add(this.updateBound);
    }
    destroy(){
        this.scene.app.ticker.remove(this.updateBound);
    }
    async spawn(){
        // this.scene.app.renderer.background.color=0x000000;
        const random = Math.random();
        const w=this.scene.app.screen.width
        const h=this.scene.app.screen.height;
        const flag=((h+w)*2+this.margin*8)*random;
        let position={x:0,y:0};
        if(flag<w+this.margin*2) {
            position.x=-this.margin+flag;
            position.y=-this.margin;
        } else if(flag<h+w+this.margin*4) {
            position.x=w+this.margin;
            position.y=-this.margin+flag-(w+this.margin*2)
        } else if(flag<h+w*2+this.margin*6) {
            position.x=this.margin+w-flag+(h+w+this.margin*4);
            position.y=this.margin+h;
        } else {
            position.x=-this.margin;
            position.y=this.margin+h-flag+(h+w*2+this.margin*6);
        }
        const enemy=new Enemy(this.scene,position);
    }
    update(time){
        this.spawnTimeCnt+=time.deltaTime;
        this.totalTimeCnt+=time.deltaTime;
            (Math.exp(this.totalTimeCnt)+Math.exp(-this.totalTimeCnt))
        if(this.spawnTimeCnt>=this.spawnInterval){
            this.spawn();
            this.spawnTimeCnt=0;
        }
    }
}