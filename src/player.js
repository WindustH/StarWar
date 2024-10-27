class Player{
    constructor(scene) {
        this.scene=scene;
        this.tag="player";
        this.texturePath = 'res/player.png';
        this.keys = { w: false, a: false, s: false, d: false,
            W: false, A: false, S: false, D: false,' ': false,
            right:false
         };
         this.meshInfo=[[[0.5,0],[0,0.3],[1,0.3]],
         [[0.5,0.5],[0,0.3],[1,0.3]]
         ,[[0.3,0.9],[0.7,0.9],[0.5,0.5]]];
        
        this.health=10;
        this.power=0;// 当前功率
        this.maxPower=50;// 最大功率
        this.powerUpSpeed=0.05;// 功率提升速度
        this.kFriction=0.001;// 摩擦系数
        this.headToTail=128;// 头尾控制点距离 与机体旋转的丝滑程度有关
        this.headpoint={
            position:{x:0,y:0},
            velocity:{x:0,y:0},
            acceleration:{x:0,y:0}}// 头部控制点物理
        this.tailpoint={position:{x:0,y:0}}// 尾部控制点  
        this.bulletSpeed=40;// 子弹速度
        this.bulletMass=1;// 子弹质量
        this.mass=200;// 飞机质量
        this.mouseTrackingRange=10;// 右键鼠标追踪的范围
        this.updateBound=this.update.bind(this);
        

        this.init();// 初始化 Player
    }
    async init() {
        this.texture = await PIXI.Assets.load(this.texturePath);
        this.createSprite();
        this.setupEventListeners();     
        this.scene.app.ticker.add(this.updateBound);
        this.hitbox=new Hitbox(this.scene.app,this.sprite,this.tag,this.meshInfo);
        this.scene.hitboxManager.add(this.hitbox);
    }
    destroy() {
        this.scene.app.stage.removeChild(this.sprite);
        this.scene.app.ticker.remove(this.updateBound);
        this.hitbox.destroy();
        window.removeEventListener('keydown', this.onKeyDownBound);
        window.removeEventListener('keyup', this.onKeyUpBound);
        this.scene.app.canvas.removeEventListener('click', this.onClickBound);
        this.scene.app.canvas.removeEventListener('rightdown',this.onMouseBound);
        this.scene.app.canvas.removeEventListener('rightup',this.onMouseUpBound);
    }
    createSprite() {
        this.sprite = PIXI.Sprite.from(this.texture);
        this.sprite.anchor.set(0.5,0);
        this.sprite.scale.set(1);
        this.headpoint.position.x = this.scene.app.screen.width / 2;
        this.headpoint.position.y = this.scene.app.screen.height / 2;
        this.tailpoint.position.x = this.scene.app.screen.width / 2;
        this.tailpoint.position.y = this.scene.app.screen.height / 2+1;
        this.sprite.rotation=0;
        this.scene.app.stage.addChild(this.sprite);
    }
    setupEventListeners() {
        this.onKeyDownBound=this.onKeyDown.bind(this);
        this.onKeyUpBound=this.onKeyUp.bind(this);
        this.onClickBound=this.onClick.bind(this);
        this.onMouseBound=this.onMouseDown.bind(this);
        this.onMouseUpBound=this.onMouseUp.bind(this);
        window.addEventListener('keydown', this.onKeyDownBound);
        window.addEventListener('keyup', this.onKeyUpBound);
        this.scene.app.canvas.addEventListener('click', this.onClickBound);
        this.scene.app.canvas.addEventListener('mousedown',this.onMouseBound);
        this.scene.app.canvas.addEventListener('mouseup',this.onMouseUpBound);
    }  
    onClick(event) {
        const audio=new Audio("res/player_shoot.wav");
        audio.play();
        // 获取 canvas 的边界和缩放比例
        const rect = this.scene.app.canvas.getBoundingClientRect();
        const scaleX = this.scene.app.canvas.width / rect.width;
        const scaleY = this.scene.app.canvas.height / rect.height;

        // 计算缩放后的鼠标位置
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        const deltaX=x-this.headpoint.position.x;
        const deltaY=y-this.headpoint.position.y;
        const distance=Math.sqrt(deltaX**2+deltaY**2);
        const bulletVelX=deltaX/distance*this.bulletSpeed+this.headpoint.velocity.x;
        const bulletVelY=deltaY/distance*this.bulletSpeed+this.headpoint.velocity.y;
        // 反作用力
        this.headpoint.velocity.x-=bulletVelX*this.bulletMass/this.mass;
        this.headpoint.velocity.y-=bulletVelY*this.bulletMass/this.mass;
        // 创建子弹
        const bullet=new Bullet(this.scene,
            {x:this.headpoint.position.x,y:this.headpoint.position.y},
            {x:bulletVelX,y:bulletVelY},
            "player_bullet");
    }
    onMouseDown(event) {
        if (event.button === 2)this.keys.right=true;
    }
    onMouseUp(event) {
        if (event.button === 2)this.keys.right=false;
    }
    onKeyDown(event) {
        if (event.key in this.keys) {
            this.keys[event.key] = true;
        }
    }
    onKeyUp(event) {
        if (event.key in this.keys) {
            this.keys[event.key] = false;
        }
    }
    
    accelerationControl(time) {
        this.headpoint.acceleration.x=0;
        this.headpoint.acceleration.y=0;
        // if(this.keys.right){
        //     const mousePosition = this.scene.app.renderer.events.pointer;
        //     // 获取 canvas 的边界和缩放比例
        //     const rect = this.scene.app.canvas.getBoundingClientRect();
        //     const scaleX = this.scene.app.canvas.width / rect.width;
        //     const scaleY = this.scene.app.canvas.height / rect.height;
        //     // 计算缩放后的鼠标位置
        //     const x = (mousePosition.clientX - rect.left) * scaleX;
        //     const y = (mousePosition.clientY - rect.top) * scaleY;
        //     const deltaX=x-this.headpoint.position.x;
        //     const deltaY=y-this.headpoint.position.y;
        //     const distance=Math.sqrt(deltaX**2+deltaY**2);
        //     if(distance>this.mouseTrackingRange) {
        //         const acceleration=this.power/(Math.abs(this.headpoint.velocity.y)+1);
        //         this.headpoint.acceleration.y = deltaY/distance*acceleration;
        //         this.headpoint.acceleration.x = deltaX/distance*acceleration;
        //     } else {
        //         this.headpoint.velocity.x *= 0.3**time.deltaTime;
        //         this.headpoint.velocity.y *= 0.3**time.deltaTime;
        //     }
        // }
        // else 
        if (this.keys.w||this.keys.W) this.headpoint.acceleration.y = -this.power/(Math.abs(this.headpoint.velocity.y)+1);
        else if (this.keys.s||this.keys.S) this.headpoint.acceleration.y = this.power/(Math.abs(this.headpoint.velocity.y)+1);
        else if (this.keys.a||this.keys.A) this.headpoint.acceleration.x = -this.power/(Math.abs(this.headpoint.velocity.x)+1);
        else if (this.keys.d||this.keys.D) this.headpoint.acceleration.x = this.power/(Math.abs(this.headpoint.velocity.x)+1);
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
    hit(){
        if(this.hitbox.hit===true){
            
            const audio=new Audio("res/player_hit.wav");
            audio.play();
            this.health--;
            this.scene.healthDisplay.score--;
            this.hitbox.hit=false;
            this.hitbox.hitBy=[];
        }
        if(this.health<=0){
            this.destroy();
            
            this.scene.endDisplay=new EndDisplay(this.scene);
        }
    }
    update(time) {
        this.hit();
        // 加速度控制
        this.accelerationControl(time);
        // 随时间提升功率
        if(this.keys.w||this.keys.s||this.keys.a||this.keys.d||
            this.keys.W||this.keys.S||this.keys.A||this.keys.D
            // ||this.keys.right
        ) {
            if(this.power<this.maxPower) this.power+=this.powerUpSpeed*time.deltaTime;
        }// 快速刹停 功率降低
        else {
            this.power*=0.99**time.deltaTime;
            this.headpoint.velocity.x *= 0.995**time.deltaTime;
            this.headpoint.velocity.y *= 0.995**time.deltaTime;
        }
        if (this.keys[' ']) {
            this.headpoint.velocity.x *= 0.5**time.deltaTime;
            this.headpoint.velocity.y *= 0.5**time.deltaTime;
        }
        
        // 位移和速度控制
        this.headpoint.velocity.x=Math.min(Math.abs(this.headpoint.velocity.x),20)*Math.sign(this.headpoint.velocity.x);
        this.headpoint.velocity.y=Math.min(Math.abs(this.headpoint.velocity.y),20)*Math.sign(this.headpoint.velocity.y);
        this.headpoint.position.x += this.headpoint.velocity.x*time.deltaTime;
        this.headpoint.position.y += this.headpoint.velocity.y*time.deltaTime;
        this.headpoint.velocity.x += this.headpoint.acceleration.x*time.deltaTime;
        this.headpoint.velocity.y += this.headpoint.acceleration.y*time.deltaTime;

        // 控制飞机在视图内
        this.headpoint.position.x = Math.max(0,Math.min(this.scene.app.screen.width, this.headpoint.position.x));
        this.headpoint.position.y = Math.max(0,Math.min(this.scene.app.screen.height, this.headpoint.position.y));
        // 贴图位置在头部控制点
        this.sprite.x=this.headpoint.position.x;
        this.sprite.y=this.headpoint.position.y;
        // 姿态控制 （尾部控制点、旋转
        this.poseControl();
    }
};
class TrajectoryLine {
    constructor(scene) {
        this.scene=scene;
        this.graphics = new PIXI.Graphics();        
        this.updateBound=this.update.bind(this);
        this.init();
    }
    init()
    {
        this.scene.app.stage.addChild(this.graphics);
        this.scene.app.ticker.add(this.updateBound);
    }
    destroy() {
        this.scene.app.stage.removeChild(this.graphics);
        this.scene.app.ticker.remove(this.updateBound);
        this.graphics.destroy();
    }
    update() {
        const mousePosition = this.scene.app.renderer.events.pointer;
        // 获取 canvas 的边界和缩放比例
        const rect = this.scene.app.canvas.getBoundingClientRect();
        const scaleX = this.scene.app.canvas.width / rect.width;
        const scaleY = this.scene.app.canvas.height / rect.height;

        // 计算缩放后的鼠标位置
        const x = (mousePosition.clientX - rect.left) * scaleX;
        const y = (mousePosition.clientY - rect.top) * scaleY;
        
        let deltaX=x-this.scene.player.headpoint.position.x;
        let deltaY=y-this.scene.player.headpoint.position.y;
        const distance=Math.sqrt(deltaX**2+deltaY**2);
        const bulletVelX=deltaX/distance*this.scene.player.bulletSpeed+
        this.scene.player.headpoint.velocity.x;
        const bulletVelY=deltaY/distance*this.scene.player.bulletSpeed+
        this.scene.player.headpoint.velocity.y;
        // 求延展到屏幕边缘需要乘的系数
        let extendX,extendY;
        if(bulletVelX>0) extendX=(this.scene.app.screen.width-this.scene.player.headpoint.position.x)/bulletVelX;
        if(bulletVelX<0) extendX=-this.scene.player.headpoint.position.x/bulletVelX;
        if(bulletVelY>0) extendY=(this.scene.app.screen.height-this.scene.player.headpoint.position.y)/bulletVelY;
        if(bulletVelY<0) extendY=-this.scene.player.headpoint.position.y/bulletVelY;
        const extend=Math.min(extendX,extendY);
        // 绘制弹道  
        const startX=this.scene.player.headpoint.position.x;
        const startY=this.scene.player.headpoint.position.y;
        const endX=this.scene.player.headpoint.position.x+bulletVelX*extend;
        const endY=this.scene.player.headpoint.position.y+bulletVelY*extend;

        this.graphics.clear();
        this.graphics.setStrokeStyle({
            width: 2,
            color: 0xFFFFFF,
            alpha: 0.5
        });
        // 画虚线
        const dashLength=20;
        deltaX = endX - startX;
        deltaY = endY - startY;
        const numDashes = Math.floor(
            Math.sqrt(deltaX * deltaX + deltaY * deltaY) / dashLength
        );
        for(let i = 0; i < numDashes; ++i) {
            const x1 = startX + (deltaX * i / numDashes);
            const y1 = startY + (deltaY * i / numDashes);
            const x2 = startX + (deltaX * (i + 0.5) / numDashes);
            const y2 = startY + (deltaY * (i + 0.5) / numDashes);
            this.graphics.moveTo(x1, y1);
            this.graphics.lineTo(x2, y2);
        }
        this.graphics.stroke();
    }
};
class Reticle {
    constructor(scene) {
        this.scene=scene;
        this.sprite = null;
        this.texturePath = 'res/reticle.png';
        this.init();
    }

    async init() {
        this.texture = await PIXI.Assets.load(this.texturePath);
        this.createSprite();
        this.setupEventListeners();
    }
    createSprite() {
        this.sprite = PIXI.Sprite.from(this.texture);
        this.sprite.anchor.set(0.5);
        this.sprite.position.set(this.scene.app.screen.width / 2, this.scene.app.screen.height / 2);
        this.sprite.scale.set(2);
        this.scene.app.stage.addChild(this.sprite);
    }

    setupEventListeners() {
        
        this.scene.app.canvas.addEventListener('mousemove',this.onMouseMove.bind(this));
    }
    onMouseMove(event){
        // 获取 canvas 的边界和缩放比例
        const rect = this.scene.app.canvas.getBoundingClientRect();
        const scaleX = this.scene.app.canvas.width / rect.width;
        const scaleY = this.scene.app.canvas.height / rect.height;
        // 计算缩放后的鼠标位置
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        this.sprite.position.set(x, y);
    }
    destroy() {
        this.scene.app.canvas.removeEventListener('mousemove',this.onMouseMove.bind(this));
        this.scene.app.stage.removeChild(this.sprite);
    }
};