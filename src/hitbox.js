class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
    add(vec) {
        return new Vector(this.x + vec.x, this.y + vec.y);
    }
    minus(vec) {
        return new Vector(this.x - vec.x, this.y - vec.y);
    }
    dotProduct(vec) {
        return this.x * vec.x + this.y * vec.y;
    }
    crossProduct(vec) {
        return this.x * vec.y - this.y * vec.x;
    }
    multiply(val) {
        return new Vector(this.x * val, this.y * val);
    }
    rotate(theta) {
        return new Vector(this.x * Math.cos(theta) + this.y * Math.sin(theta),
                          -this.x * Math.sin(theta) + this.y * Math.cos(theta));
    }
    copy(){
        return new Vector(this.x, this.y);
    }
}

class Triangle {
    constructor(vertices = []) {
        this.vertices = vertices;
    }
    contain(vec) {
        const sign1 = Math.sign(vec.minus(this.vertices[0]).crossProduct(this.vertices[1].minus(this.vertices[0])));
        const sign2 = Math.sign(vec.minus(this.vertices[1]).crossProduct(this.vertices[2].minus(this.vertices[1])));
        const sign3 = Math.sign(vec.minus(this.vertices[2]).crossProduct(this.vertices[0].minus(this.vertices[2])));
        return sign1 === sign2 && sign2 === sign3;
    }
    intersect(tr) {
        for (let i = 0; i < 3; i++) {
            if (this.contain(tr.vertices[i])||tr.contain(this.vertices[i])) return true;
        }
        return false;
    }
    transform(vec, theta) {
        return new Triangle(this.vertices.map(v => v.rotate(theta).add(vec)));
    }
    copy(){
        return new Triangle(this.vertices.map(v => v.copy()));
    }
}

class Mesh {
    constructor(triangles = []) {
        this.triangles = triangles;
        this.transformedTriangles = triangles.map(v => v.copy());
    }
    addTriangle(triangle) {
        this.triangles.push(triangle);
    }
    intersect(mesh) {
        for (let tri1 of this.transformedTriangles) {
            for (let tri2 of mesh.transformedTriangles) {
                if (tri1.intersect(tri2)) return true;
            }
        }
        return false;
    }
    transform(vec, theta) {
        this.transformedTriangles = this.triangles.map(v => v.transform(vec, theta));
    }
}

class Hitbox {
    constructor(app,sprite,tag,meshInfo=[[[1,1],[0,0],[1,0]],[[0,0],[1,1],[0,1]]]) {
        this.app = app;
        this.tag=tag;
        this.mesh = null;
        this.hit = false;// 是否被碰撞
        this.hitBy=[];// 与某类物体碰撞
        this.boxies=[];
        this.sprite=sprite;
        this.meshInfo=meshInfo;
        this.destroyed=false;
        if(DEBUG) this.graphics = new PIXI.Graphics();
        if(DEBUG) this.text = new PIXI.Text({
            text:this.tag, 
            style:{
                fontFamily: 'Arial',
                fontSize: 32,
                fill: 0x2E3440,
                align: 'center'
        }});
        
        this.init()
    }
    init(){
        if(DEBUG) this.app.stage.addChild(this.graphics);
        if(DEBUG) this.app.stage.addChild(this.text);
        this.createMesh();
        this.updateBound=this.update.bind(this);
        this.app.ticker.add(this.updateBound);
    }
    destroy() {
        if(DEBUG) this.app.stage.removeChild(this.graphics);
        if(DEBUG) this.app.stage.removeChild(this.text);
        this.app.ticker.remove(this.updateBound);
        if(DEBUG) this.graphics.destroy();
        if(DEBUG) this.text.destroy();
        this.mesh=null;
        this.destroyed=true;
    }   
    createMesh()
    {
        const w=this.sprite.width;
        const h=this.sprite.height;
        const aw=this.sprite.anchor.x;
        const ah=this.sprite.anchor.y;
        const trList=[];
        for(let trInfo of this.meshInfo)
        {
            const v0=new Vector((trInfo[0][0]-aw)*w,(trInfo[0][1]-ah)*h);
            const v1=new Vector((trInfo[1][0]-aw)*w,(trInfo[1][1]-ah)*h);
            const v2=new Vector((trInfo[2][0]-aw)*w,(trInfo[2][1]-ah)*h);
            const tr=new Triangle([v0,v1,v2]);
            trList.push(tr);
        }
        this.mesh=new Mesh(trList);
        this.mesh.transform(new Vector(this.sprite.x,this.sprite.y),this.sprite.rotation);
    }
    display(color) {
        // this.app.renderer.background.color=0x000000;
        this.text.x=this.sprite.x;
        this.text.y=this.sprite.y;
        this.graphics.clear();
        this.graphics.setStrokeStyle({
            width: 1,
            color: color,
            alpha: 1
        });
        for (let triangle of this.mesh.transformedTriangles) {
            this.graphics.moveTo(triangle.vertices[0].x, triangle.vertices[0].y);
            this.graphics.lineTo(triangle.vertices[1].x, triangle.vertices[1].y);
            this.graphics.lineTo(triangle.vertices[2].x, triangle.vertices[2].y);
            this.graphics.lineTo(triangle.vertices[0].x, triangle.vertices[0].y);
        }
        this.graphics.stroke();
    }
    update(){
        if(DEBUG && this.hit) this.display(0xFF0000);
        if(DEBUG && !this.hit) this.display(0x00FF00);
        this.mesh.transform(new Vector(this.sprite.x,this.sprite.y),-this.sprite.rotation);  
        // this.collide();
    }
    // 链接一个碰撞盒
    // bind(hitbox){
    //     this.boxies.push(hitbox);
    // }
    // 检测碰撞
    // collide() {
    //     this.hit = false;
    //     this.hitBy=[];
    //     for(let box of this.boxies){
            
    //         if (this.mesh.intersect(box.mesh)) {
    //             this.hit = true;
    //             this.hitBy.push(box.tag);
    //             box.hit = true;
    //             box.hitBy.push(this.tag);
    //         }
    //     }
    // }
}

class HitboxManager{
    constructor(app){
        this.app=app;
        this.updateBound=this.update.bind(this);       
        this.boxGroups={};
        this.rules=[];
        this.init();
    }
    init(){
        this.app.ticker.add(this.updateBound);
    }
    destroy(){
        this.app.ticker.remove(this.updateBound);
    }
    add(hitbox){
        if(!this.boxGroups.hasOwnProperty(hitbox.tag)) this.boxGroups[hitbox.tag]=[];
        this.boxGroups[hitbox.tag].push(hitbox);
    }
    addRule(tag1,tag2){
        this.rules.push([tag1,tag2]);
        if(!this.boxGroups.hasOwnProperty(tag1)) this.boxGroups[tag1]=[];
        if(!this.boxGroups.hasOwnProperty(tag2)) this.boxGroups[tag2]=[];
    }
    update(){
        // 排除被摧毁了的碰撞盒并且重置碰撞盒状态
        for(let tag in this.boxGroups){
            for(let box of this.boxGroups[tag]){
                if(box.destroyed) this.boxGroups[tag]=this.boxGroups[tag].filter(item => item !== box)
                else {
                    box.hit=false;
                    box.hitBy=[];
                }
            }
        }
        // 按照规则检测碰撞
        for(let rule of this.rules){
            for(let box1 of this.boxGroups[rule[0]]){
                for(let box2 of this.boxGroups[rule[1]]){
                    if (box1.mesh.intersect(box2.mesh)) {
                        box1.hit = true;
                        box1.hitBy.push(rule[1]);
                        box2.hit = true;
                        box2.hitBy.push(rule[0]);
                    }
                }
            }
        }
    }
}