<template>
  <div>
    <div ref="container2" id="container2">
    </div>
  </div>
</template>

<script setup>
// npm i three-obj-mtl-loader --save
import { onMounted,nextTick,computed,reactive,ref,onBeforeUnmount,watch,watchEffect,toRaw} from "vue";
import * as THREE from "three"; //引入Threejs
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import data from './data'
// threejs部分
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js"; // obj加载器
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js"; // mtl加载器
import { CSS2DRenderer,CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js"; // css2d加载器
import { Geometry } from "three/examples/jsm/deprecated/Geometry.js"; // 加载器
//三维场景显示范围控制系数，系数越大，显示的范围越大
const s = 200;
const width = window.innerWidth; //窗口宽度
const height = window.innerHeight; //窗口高度
// 场景
let scene = new THREE.Scene();

let objLoader = new OBJLoader();

let mtlLoader = new MTLLoader();

let textureLoader = new THREE.TextureLoader();

const clock = new THREE.Clock();

let raycaster = new THREE.Raycaster();//创建光线投射对象
let mouse = new THREE.Vector2();//创建二维平面

let clip = {}
let mixers = []
let KeyFrames = []
let actions = []
// 模型
let mesh = {};
// 相机
let camera = {};
// 相机设置
let renderer = {};
// 控制器
let controls = {};
// css2D渲染器
let labelRenderer = {};

// 盒子
let boxHelper = null;

// 当前选中的模型
let selectedObject = reactive({object:{}});
// 当前场景
const curScene = computed(() => data['scene1'])
// const width = computed(() => window.innerWidth)
// const height = computed(() => window.innerHeight)


const container2 = ref(null)
// const panel = ref(null)
let hostMesh = []
let pumpMesh = []
let pumpFanMesh = []

watch(()=>selectedObject.object,(newValue,oldValue)=>{
  //vue中的响应式对象可使用toRaw()方法获取原始对象。
  if(JSON.stringify(toRaw(newValue)) === '{}'){
    let objectByName = scene.getObjectByName('panel');
    if(objectByName) objectByName.parent.remove(objectByName)
  }
},{
  // deep:true
})
// 初始化
async function init() {
  initPoint();
  initCamera();
  createRenderer()
  tool()
  await importMesh()
  createCss2DRenderer()
  createObjectMixer()
  // 挂载到dom中
  // document.getElementById("container2").appendChild(renderer.domElement);
  container2.value.appendChild(renderer.domElement);
  //创建控件对象
  controls = new OrbitControls(camera, labelRenderer.domElement);
  // 使动画循环使用时阻尼或自转 意思是否有惯性
  controls.enableDamping = true;
  controls.minDistance = 120
  controls.maxDistance = 10000
  controls.addEventListener("change", (e) => {
    // renderer.render(scene, camera);
  }); //监听鼠标、键盘事件

  render()
}

function tag(){
  const div = document.createElement('div');
  // div.style.visibility = 'hidden';
  div.innerHTML = 'GDP';
  div.className = 'label';
  div.style.padding = '4px 10px';
  div.style.color = '#fff';
  div.style.fontSize = '16px';
  div.style.position = 'absolute';
  div.style.backgroundColor = 'rgba(25,25,25,0.5)';
  div.style.borderRadius = '5px';
  div.addEventListener('mousedown',function (){
    console.log(22222222)
  })
  // div.style.pointerEvents = 'none';//避免HTML标签遮挡三维场景的鼠标事件
  // div元素包装成为css2模型对象CSS2DObject
  const label =new CSS2DObject(div);
  // label.position.set( 101, 111, 111 );
  // 设置HTML元素标签在three.js世界坐标中位置
  // label.position.set(x, y, z);
  return label;
}
// CSS2DObject
function createCss2DRenderer() {
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(width, height);
  labelRenderer.domElement.style.position = 'absolute';
// 相对鼠标的相对偏移
  labelRenderer.domElement.style.top = '0px';
  labelRenderer.domElement.style.left = '0px';
  // labelRenderer.domElement.style.background = 'rgba(102,203,136,0.4)';
//设置.pointerEvents=none，以免模型标签HTML元素遮挡鼠标选择场景模型
//   labelRenderer.domElement.style.pointerEvents = 'none';
  container2.value.appendChild(labelRenderer.domElement);
}
// 工具
function tool() {
  //辅助工具
  // var helper = new THREE.AxesHelper(50);
  // scene.add(helper);
  const gridHelper = new THREE.GridHelper( 1000, 50,'red','blue' );
  scene.add( gridHelper );
}
// 初始化模型
function initMesh() {
  //  (1). 创建一个立方体几何对象Geometry
  var geometry = new THREE.BoxGeometry(100, 100, 100);
  //  (2). 创建材质，就是立方体的表面那一层，这里设置成蓝色
  var material = new THREE.MeshLambertMaterial({
    color: 0x0000ff,
  });
  //  (3). 使用刚刚定义的玩意儿创建网格模型对象（一个有蓝色的立方体）
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
}
// 初始化光源
function initPoint() {
  // 白色的光源
  var point = new THREE.PointLight(0xffffff);
  // 点光源位置
  point.position.set(400, 200, 300);
  // 点光源添加到场景中
  scene.add(point);
  //  环境光
  var ambient = new THREE.AmbientLight(0x444444);
  scene.add(ambient);
}
// 初始化相机
function initCamera() {
  var k = width / height; //窗口宽高比
  //创建相机对象
  // camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000); // 正交相机
  camera = new THREE.PerspectiveCamera( 50, width / height, 1, 10000 );// 透视
  //设置相机位置
  camera.position.set(600, 300, 0);
  //设置相机方向(指向的场景对象)
  camera.lookAt(scene.position);
}
// 生产渲染器
function createRenderer() {
  // 渲染器
  renderer = new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setSize(width, height); //设置渲染区域尺寸
  renderer.setClearColor(0xb9d3ff, 1); //设置背景颜色
}

// 加载纹理
let textureLoaderRes = function (url) {
  return textureLoader.load(url, function (map) {

    // map.wrapS = THREE.RepeatWrapping;
    // map.wrapT = THREE.RepeatWrapping;
    return map
  });
}

async function importMesh() {
  pumpMesh = await importPump();
  hostMesh = await importHost();
  pumpFanMesh = await importPumpFan();
  const meshs = [...pumpMesh,...hostMesh,...pumpFanMesh]
  let group1 = new THREE.Group();
  group1.add(...meshs.filter(item=>item.group === 1))
  group1.name = 'group1'
  let group2 = new THREE.Group();
  group2.add(...meshs.filter(item=>item.group === 2))
  group2.name = 'group2'
  scene.add(group1,group2)
  // scene.add(...pumpMesh)
}
// 导入主机
async function importHost() {
  let hostMeshList = []
  const host = curScene.value.host
  for (let i = 0; i < host.length; i++) {
    hostMeshList.push(await loadMtl(host[i]))
  }
  return hostMeshList
}
// 导入水泵
async function importPump() {
  let pumpMeshList = []
  const pump = curScene.value.pump
  for (let i = 0; i < pump.length; i++) {
    pumpMeshList.push(await loadMtl(pump[i]))
  }
  return pumpMeshList
}
// 导入风扇
async function importPumpFan() {
  let pumpFanMeshList = []
  const pumpFan = curScene.value.pumpFan
  for (let i = 0; i < pumpFan.length; i++) {
    pumpFanMeshList.push(await loadMtl(pumpFan[i]))
  }
  return pumpFanMeshList
}

// 加载材质后加载模型
function loadMtl({name ='',mtlUrl = '',objUrl,pngUrl,position,group}) {
  return new Promise((resolve,reject) => {
    mtlLoader.load(mtlUrl, function (material) {
      let objLoader = new OBJLoader();
      //设置当前加载的纹理
      objLoader.setMaterials(material);
      // objLoader.setPath('/lib/assets/models/');
      objLoader.load(objUrl, function (object) {
        console.log('模型：',object);
        // //获取两个翅膀的位置
        // var wing2 = object.children[5];
        // var wing1 = object.children[4];
        //
        // //设置两个翅膀的透明度
        // wing1.material.opacity = 0.6;
        // wing1.material.transparent = true;
        // wing1.material.depthTest = false;
        // wing1.material.side = THREE.DoubleSide;
        //
        // wing2.material.opacity = 0.6;
        // wing2.material.depthTest = false;
        // wing2.material.transparent = true;
        // wing2.material.side = THREE.DoubleSide;
        //
        if(!mtlUrl){
          object.traverse(function(child) {
            if (child instanceof THREE.Mesh) {
              //设置模型皮肤
              // child.material.color.set('red')
            }
          });
        }
        // //将模型缩放并添加到场景当中
        // object.scale.set(100, 100, 100);
        //     object.material.map =  textureLoaderRes(pngUrl)
        object.traverse(function(child) {
          if (child instanceof THREE.Mesh) {
            //设置模型皮肤
            child.material.map = textureLoaderRes(pngUrl)
          }
        });
        object.name = name
        object.group = group
        object.position.set(position.x, position.y, position.z); // x,y,z
        // playAnimation(object)
        resolve(object)
      },function ( xhr ) {
        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
      },
      function (error){
        console.log( 'An error happened',error );
        reject()
      })
    });
  })
}

// 创建关键帧动画片段
function createKeyFrame(mesh) {
  console.log('创建关键帧传入的对象',mesh);
  // var scaleTrack = new THREE.KeyframeTrack('水泵1.scale',[0,20],[1,1,1,3,3,3])
  var scaleTrack = new THREE.KeyframeTrack('.rotation[x]',[0,3],[0,Math.PI *2])
  var duration = 3
  return new THREE.AnimationClip(mesh.name+'default',duration,[scaleTrack])
}

function playAnimation(group) {
  mixers.push(new THREE.AnimationMixer(group))
  mixers.forEach(mixer=>{
    let AnimationAction = mixer.clipAction(clip)
    // AnimationAction.timeScale = 20  // 速率
    // AnimationAction.loop = THREE.LoopOnce // 循环类型 有三种
    // AnimationAction.clampWhenFinished = true // 是否保持在最后一帧的状态
    AnimationAction.time = 5 // 进度
    // clip.duration = AnimationAction.time // 进度
    AnimationAction.play()
  })
}
let modified = {
  // loop : THREE.LoopOnce,
  // clampWhenFinished : true,
  timeScale : 4,
  time :5
}

function createObjectMixer() {
  pumpFanMesh.forEach(mesh=>{
    mixers.push(new THREE.AnimationMixer(mesh));
    KeyFrames.push(createKeyFrame(mesh))
  })
  mixers.forEach((mixer,index) =>{
    actions.push(
        overwriteProps( //overwrite props while clipping
            mixer.clipAction(KeyFrames[index]),
            modified
        )
    )
  })
  actions.forEach(action=>{
    console.log('action111111111',action);
    action.play();
  })
}



let overwriteProps = (proto, object) => {
  Object.entries(object).map(entry => {
    proto[entry[0]] = entry[1];
  })
  return proto;
}

// 键盘移动事件
function keyPressed(e) {
  var key = e.keyCode;
  if (!boxHelper) {
    // document.getElementById('notice').innerHTML = '请先选中物体' + key.toString()
  }
  switch (key) {
    case 37: // 左
      selectedObject.object.translateX(-1);
      break;
    case 39: // 右
      selectedObject.object.position.x += 1;
      break;
    case 38: // 上
      selectedObject.object.position.z -= 1;
      break;
    case 40: // 下
      selectedObject.object.position.z += 1;
      break;
  }
}
// 鼠标点击事件
function mouseDownFuc(e){
  e.preventDefault()
  // 声明 raycaster 和 mouse 变量
  // let raycaster = new THREE.Raycaster();//创建光线投射对象
  // let mouse = new THREE.Vector2();//创建二维平面
  // 右击触发
  if (e.button === 2) {
    let intersectsObjArr = getSelectOBj(mouse, raycaster, e);//通过封装的getSelsectOBj函数获取鼠标选中对象集合，e是点击事件对象
    if (intersectsObjArr.length > 0) {
      console.log('射线穿过的面',intersectsObjArr);
      let objectMesh = intersectsObjArr.find(element => element.object.type === 'Mesh'); // 寻找第一个mesh对象，对象数组是按距离由近到远排序的
      // let objectMesh = intersectsObjArr[0] // 寻找第一个mesh对象，对象数组是按距离由近到远排序的
      if (objectMesh) {
        // objectMesh.object.material.color.set(0xff0000)
        if (boxHelper) {
          scene.remove(boxHelper)
        }
        boxHelper = new THREE.BoxHelper(objectMesh.object,0xffff00);
        scene.add(boxHelper)
        // 如果此次点击的模型 和 上次点击模型不一样就执行
        if(selectedObject.object.parent?.name !== objectMesh.object.parent?.name){
          selectedObject.object = objectMesh.object
          renderDiv(selectedObject.object)
        }
      }else{
        boxHelper && scene.remove(boxHelper)
        selectedObject.object = {}
      }
    }else{
      boxHelper && scene.remove(boxHelper)
      selectedObject.object = {}
    }
  }
}
//获取事件操作对象
function getSelectOBj(mouse, raycaster, e) {
  // 通过鼠标点击位置,计算出 raycaster 所需点的位置,以屏幕为中心点,范围 -1 到 1
  mouse.x =  e.clientX / renderer.domElement.clientWidth*2-1;
  mouse.y =  -(e.clientY / renderer.domElement.clientHeight*2)+1;
  //通过鼠标点击的位置(二维坐标)和当前相机的矩阵计算出射线位置
  raycaster.setFromCamera(mouse,camera);
  // 获取与raycaster射线相交的数组集合，其中的元素按照距离排序，越近的越靠前
  let intersects = raycaster.intersectObjects(scene.children, true);
  return intersects;//返回连线经过的物体集合
}

// 更新div的位置
function renderDiv(object) {
  console.log('panel传入的模型',object);
  if(JSON.stringify(object) === '{}'){
    return
  }

  // 用CSS2DRenderer渲染的时候，他会生成一个div专门存放所有的label，也就是CSS2DRenderer.js里面的那个domElement
  // 试过直接找到这个Div删掉里面的子元素。发现不行。
  // 每个label其实都是绑在一个三维物体上的，这样标签才能在三维操作中找到自己的位置。
  // 所以我们需要先找到那个三维物体，才能顺利删掉标签。
  // 这需要我们在生成CSS2DObject的时候，给这个物体一个名字，因为scene里面有一个函数是通过名字找到物体的。
  // 在需要删除的地方找到它。并且通过它找到它的妈妈把它删掉。
  let objectByName = scene.getObjectByName('panel');
  if(objectByName) objectByName.parent.remove(objectByName)

  var panel = document.createElement('div');
  var name = document.createElement('div');
  var button = document.createElement('button');
  panel.className = 'panel'
  name.className = 'name'
  button.className = 'button'
  button.type = 'button'
  button.innerHTML = '点击开机'
  panel.appendChild(name);
  panel.appendChild(button);
  // panel.style.position = 'absolute'
  // panel.style.backgroundColor = 'rgba(25,25,25,0.5)';
  // panel.style.left = '0px'
  // panel.style.top = '0px'
  var num = 0
  button.addEventListener('pointerdown',function (){
    num++
    if (num % 2 === 0) {
      button.innerHTML = '点击开机'
      console.log(actions);
      let action = actions.find(item=>{
        return item.getRoot().name === '水泵风扇'+ object.parent.group
      });
      action.play()
    }else{
      button.innerHTML = '点击关机'
      let action = actions.find(item=>{
        return item.getRoot().name === '水泵风扇'+ object.parent.group
      });
      action.stop()
    }
  },true)
  // 显示模型信息
  name.innerHTML = "name:" + object.parent.name
  const label =new CSS2DObject(panel);
  label.name = 'panel'
  object.add(label)
}

// 循环渲染
const render = () => {
  requestAnimationFrame(render);
  controls.update(); // 轨道控制器的更新
  // renderer.clear(); // 清除画布

  // const elapsed = clock.getElapsedTime();
  // pumpMesh.position.set( Math.sin( elapsed ) * 151, 0, Math.cos( elapsed ) * 151 );
  let delta = clock.getDelta();
  if(mixers.length !== 0){
    mixers.forEach(mixer=>{
      mixer.update( delta)
    })
  }
  renderer.render(scene, camera);
  labelRenderer.render( scene, camera );
  // if (pumpFanMesh.length > 0) {
  //   pumpFanMesh.forEach(item=>{
  //     if (item.onOff) {
  //       item.rotateX(0.1);
  //     }
  //   })
  // }
};


onMounted(() => {
  init();
  window.addEventListener('mouseup', mouseDownFuc,false);
  window.addEventListener('keydown', keyPressed,false);
  // onresize 事件会在窗口被调整大小时发生
  window.onresize=function(){
    // 重置渲染器输出画布canvas尺寸
    renderer.setSize(window.innerWidth,window.innerHeight);
    labelRenderer.setSize(window.innerWidth,window.innerHeight);
    // 重置相机投影的相关参数
    let k = window.innerWidth/window.innerHeight;//窗口宽高比
    // camera.left = -s * k;
    // camera.right = s * k;
    // camera.top = s;
    // camera.bottom = -s;
    camera.aspect = k
    // 渲染器执行render方法的时候会读取相机对象的投影矩阵属性projectionMatrix
    // 但是不会每渲染一帧，就通过相机的属性计算投影矩阵(节约计算资源)
    // 如果相机的一些属性发生了变化，需要执行updateProjectionMatrix ()方法更新相机的投影矩阵
    camera.updateProjectionMatrix();
  };
});
onBeforeUnmount(()=>{
  container2.value.removeChild(labelRenderer.domElement)
  container2.value.removeChild(renderer.domElement)
  console.log('selectedObject ',selectedObject.object);
})
</script>
<style scoped>
:deep(.panel) {
  color: red;
  position: absolute;
  top: -70px;
  left: 0;
  height: 100px;
  background: burlywood;
  text-align: center;
  padding:20px
}
:deep(.name) {
  color: red;
}
:deep(.button) {
  margin-top: 20px;
  color: red;
}
</style>

