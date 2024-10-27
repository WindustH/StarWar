class Scene{
    constructor(){
        // this.audioList={
        //     "player_shoot":'res/player_shoot.wav',
        //     "player_hit":'res/player_hit.wav',
        //     "enemy_shoot":'res/enemy_shoot.wav',
        //     "enemy_hit":'res/enemy_hit.wav',
        // }
        this.enemyList=[];
        this.bulletList=[];
        this.bgm=new Audio("res/bgm.flac");
        this.bgm.volume = 0.5;
        this.bgm.loop=true;
        
    }
    init(){
    }
    destroy(){
    }
}
class ScoreDisplay{
    constructor(scene){
        this.scene=scene;
        this.score=0;
        this.text = new PIXI.Text({
            text:"Score: 0", 
            style:{
                fontFamily: 'Arial',
                fontWeight:'bold',
                fontSize: 32,
                fill: 0xD8DEE9,
                align: 'center'
        }});
        this.text.x=15;
        this.text.y=15;
        this.updateBound=this.update.bind(this);
        this.init()
    }

    init(){
        this.scene.app.stage.addChild(this.text);
        this.scene.app.ticker.add(this.updateBound);
    }
    destroy(){
        this.scene.app.ticker.remove(this.updateBound);
        this.scene.app.stage.removeChild(this.text);
        this.text.destroy();
    }
    update(){
        this.text.text="Score: "+this.score.toString();
    }

}
class HealthDisplay{
    constructor(scene){
        this.scene=scene;
        this.score=10;
        this.text = new PIXI.Text({
            text:"Health: 0", 
            style:{
                fontFamily: 'Arial',
                fontWeight:'bold',
                fontSize: 32,
                fill: 0xD8DEE9,
                align: 'center'
        }});
        this.text.x=15;
        this.text.y=50;
        this.updateBound=this.update.bind(this);
        this.init()
    }

    init(){
        this.scene.app.stage.addChild(this.text);
        this.scene.app.ticker.add(this.updateBound);
    }
    destroy(){
        this.scene.app.ticker.remove(this.updateBound);
        this.scene.app.stage.removeChild(this.text);
        this.text.destroy();
    }
    update(){
        this.text.text="Health: "+this.score.toString();
    }

}
class StartDisplay{
    constructor(scene) {
        this.scene=scene;
        this.sprite = null;
        this.texturePath = 'res/start.png';
        this.onClickBound=this.onClick.bind(this);
        this.init();
    }

    async init() {
        
        this.texture = await PIXI.Assets.load(this.texturePath);
        this.createSprite();
        this.sprite.addEventListener('click', this.onClickBound);
    }
    createSprite() {
        this.sprite = PIXI.Sprite.from(this.texture);
        this.sprite.anchor.set(0.5);
        this.sprite.position.set(this.scene.app.screen.width / 2, this.scene.app.screen.height / 2);
        this.sprite.scale.set(2);
        this.scene.app.stage.addChild(this.sprite);
    }

    destroy() {
        this.sprite.removeEventListener('click', this.onClickBound);
        this.scene.app.stage.removeChild(this.sprite);
    }
    onClick(){
        document.body.style.cursor = 'none';
        this.scene.bgm.currentTime = 0
        this.scene.bgm.play();
        this.scene.scoreDisplay=new ScoreDisplay(this.scene);
        this.scene.healthDisplay=new HealthDisplay(this.scene);
        this.scene.hitboxManager=new HitboxManager(this.scene.app);
        this.scene.hitboxManager.addRule("player_bullet","enemy");
        this.scene.hitboxManager.addRule("player","enemy");
        this.scene.hitboxManager.addRule("enemy_bullet","player");
        this.scene.player=new Player(this.scene);
        this.scene.reticle = new Reticle(this.scene);
        this.scene.trajectoryline = new TrajectoryLine(this.scene);
        this.scene.incubator=new Incubator(this.scene);
        this.destroy();
    }
};
class EndDisplay{
    constructor(scene) {
        this.scene=scene;
        this.sprite = null;
        this.texturePath = 'res/end.png';
        this.onClickBound=this.onClick.bind(this);
        this.init();
    }

    async init() {
        document.body.style.cursor = 'auto';
        this.scene.bgm.pause();
        const enemyList=this.scene.enemyList.slice();
        const bulletList=this.scene.bulletList.slice();
        for(let enemy of enemyList) enemy.destroy();
        for(let bullet of bulletList) bullet.destroy();

        this.scene.trajectoryline.destroy();
        this.scene.reticle.destroy();
        this.scene.scoreDisplay.destroy();
        this.scene.healthDisplay.destroy();
        this.scene.hitboxManager.destroy();
        this.scene.incubator.destroy();

        this.texture = await PIXI.Assets.load(this.texturePath);
        this.createSprite();
        this.sprite.addEventListener('click', this.onClickBound);
    }
    createSprite() {
        this.sprite = PIXI.Sprite.from(this.texture);
        this.sprite.anchor.set(0.5);
        this.sprite.position.set(this.scene.app.screen.width / 2, this.scene.app.screen.height / 2);
        this.sprite.scale.set(2);
        this.scene.app.stage.addChild(this.sprite);
    }

    destroy() {
        this.sprite.removeEventListener('click', this.onClickBound);
        this.scene.app.stage.removeChild(this.sprite);
    }
    onClick(){
        this.scene.startDisplay=new StartDisplay(this.scene);
        this.destroy();
    }
};