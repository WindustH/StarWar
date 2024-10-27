class Bullet{
    constructor(scene,position,velocity,tag,texturePath='res/bullet1.png') {
        this.scene=scene;
        this.texturePath = texturePath;
        this.position=position;
        this.velocity=velocity;
        this.tag=tag;
        this.init()
    }
    async init() {
        this.texture = await PIXI.Assets.load(this.texturePath);     
        this.createSprite();     
        this.updateBound=this.update.bind(this);
        this.scene.app.ticker.add(this.updateBound);
        this.hitbox=new Hitbox(this.scene.app,this.sprite,this.tag);   
        this.scene.hitboxManager.add(this.hitbox);
        this.scene.bulletList.push(this);
    }
    destroy() {
        this.scene.app.stage.removeChild(this.sprite);
        this.scene.app.ticker.remove(this.updateBound);
        this.hitbox.destroy();
        this.scene.bulletList=this.scene.bulletList.filter(item => item !== this);
    }
    createSprite() {
        this.sprite = PIXI.Sprite.from(this.texture);
        // this.sprite.texture.source.scaleMode = 'nearest';
        this.sprite.anchor.set(0.5,0.5);
        this.sprite.scale.set(1);
        this.sprite.x=this.position.x;
        this.sprite.y=this.position.y;
        this.sprite.rotation=0;
        if(this.velocity.y===0 && this.velocity.x!==0) this.sprite.rotation=Math.PI/2*Math.sign(this.velocity.x);
        else if(this.velocity.y!=0) this.sprite.rotation=Math.atan(-this.velocity.x/this.velocity.y)+
        0.5*Math.PI*(1+Math.sign(this.velocity.y));
        this.scene.app.stage.addChild(this.sprite);
    }
    hit(){
        if(this.hitbox.hit===true){
            this.destroy();
        }
    }
    update(time) {
        this.hit();
        if(this.sprite.x<0 || this.sprite.x>this.scene.app.screen.width) {this.destroy();return;}
        if(this.sprite.y<0 || this.sprite.y>this.scene.app.screen.height) {this.destroy();return;}
        this.sprite.x += this.velocity.x*time.deltaTime;
        this.sprite.y += this.velocity.y*time.deltaTime;
    }
};
class RoundBulletGroup{
    constructor(scene,position,velocity,spreadSpeed,size,tag,texturePath='res/bullet1.png') {
        this.scene=scene;
        this.texturePath = texturePath;
        this.position=position;
        this.velocity=velocity;
        this.tag=tag; 
        this.spreadSpeed=spreadSpeed;
        this.size=size;
        this.init()
    }
    async init(){
        for(let i=0;i<this.size;i++){
            let theta=2*Math.PI/this.size*i;
            let vel={
                x:this.velocity.x+Math.cos(theta)*this.spreadSpeed,
                y:this.velocity.y+Math.sin(theta)*this.spreadSpeed
            }
            const bullet=new Bullet(this.scene,this.position,vel,this.tag,this.texturePath);    
        }
    }
    destroy(){
    }
};