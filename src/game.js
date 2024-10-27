PIXI.TextureStyle.defaultOptions.scaleMode = 'nearest';

const app = new PIXI.Application();

await app.init({ 
    background: '#5E81AC', 
    width: 1080, 
    height: 720,
    eventMode: 'static',
    eventFeatures: {
        move: true,
        globalMove: false,
        click: true,
        wheel: true,
    }
});

app.canvas.interactive = true;
app.canvas.eventMode = 'static';

// Then adding the application's canvas to the DOM body.
document.body.appendChild(app.canvas);

// const playerBulletList=[];
// const enemyList=[];
const scene=new Scene();
scene.app=app;
scene.startDisplay=new StartDisplay(scene);

// const bulletgroup=new RoundBulletGroup(app,{x:500,y:500},{x:5,y:5},3,16,"a");
