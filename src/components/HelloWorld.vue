<template>
  <div>
    <div ref="container2" id="container2">
<!--      <div ref="panel" style="width: 100px;height: 100px;background: greenyellow;z-index: 1111;position: relative">这是个面板</div>-->
      <div id="notice"></div>
    </div>
  </div>
</template>

<script setup>
import { defineComponent, onMounted,nextTick,computed,reactive,ref} from "vue";
import * as THREE from "three"; //引入Threejs
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import data from './data'
// threejs部分
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js"; // gltf加载器
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js"; // gltf加载器
import { CSS2DRenderer,CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js"; // gltf加载器
import { Geometry } from "three/examples/jsm/deprecated/Geometry.js"; // gltf加载器
//三维场景显示范围控制系数，系数越大，显示的范围越大
const s = 200;
// 场景
let scene = new THREE.Scene();

let objLoader = new OBJLoader();

let mtlLoader = new MTLLoader();

let textureLoader = new THREE.TextureLoader();

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
let selectedObject = {};
// 当前场景
const curScene = computed(() => data['scene1'])

const container2 = ref(null)
const panel = ref(null)

let hostMesh = null
let pumpMesh = null
let pumpFanMesh = null

// 初始化
async function init() {
  initPoint();
  initCamera();
  tool()
  await importMesh()
  GUIPanel()
  const label = tag();
  pumpMesh.add(label);
  // 挂载到dom中
  // document.getElementById("container2").appendChild(renderer.domElement);
  container2.value.appendChild(renderer.domElement);
  //创建控件对象
  controls = new OrbitControls(camera, renderer.domElement);
  // 使动画循环使用时阻尼或自转 意思是否有惯性
  controls.enableDamping = true;
  controls.addEventListener("change", () => {
    // renderer.render(scene, camera);
  }); //监听鼠标、键盘事件
  render()
}

function tag(){
  const div = document.createElement('div');
  // div.style.visibility = 'hidden';
  div.innerHTML = 'GDP';
  div.style.padding = '4px 10px';
  div.style.color = '#fff';
  div.style.fontSize = '16px';
  // div.style.position = 'absolute';
  div.style.backgroundColor = 'rgba(25,25,25,0.5)';
  div.style.borderRadius = '5px';
  div.onclick = function () {
    console.log(1111)
  };
  // div元素包装成为css2模型对象CSS2DObject
  const label =new CSS2DObject(div);
  // label.position.set( 101, 111, 111 );
  // div.style.pointerEvents = 'none';//避免HTML标签遮挡三维场景的鼠标事件
  // 设置HTML元素标签在three.js世界坐标中位置
  // label.position.set(x, y, z);
  return label;
}
// CSS2DObject
function GUIPanel() {
  // var moonLabel = new CSS2DObject(panel.value);
  // moonLabel.position.set( 10, 1, 0 );
  // hostMesh.add( moonLabel );
  // labelRenderer = new CSS2DRenderer();
  // labelRenderer.setSize( window.innerWidth, window.innerHeight );
  // labelRenderer.domElement.style.position = 'absolute';
  // labelRenderer.domElement.style.top = 0;
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
// 相对鼠标的相对偏移
  labelRenderer.domElement.style.top = '0px';
  labelRenderer.domElement.style.left = '0px';
// //设置.pointerEvents=none，以免模型标签HTML元素遮挡鼠标选择场景模型
  labelRenderer.domElement.style.pointerEvents = 'none';
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
  var width = window.innerWidth; //窗口宽度
  var height = window.innerHeight; //窗口高度
  var k = width / height; //窗口宽高比
  //创建相机对象
  // camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000);
  camera = new THREE.PerspectiveCamera( 50, width / height, 1, 10000 );
  //设置相机位置
  camera.position.set(0, 400, 600);
  //设置相机方向(指向的场景对象)
  camera.lookAt(scene.position);
  // 渲染器
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height); //设置渲染区域尺寸
  renderer.setClearColor(0xb9d3ff, 1); //设置背景颜色
}
// 渲染单个模型
function loadSingleModel(url) {
  return loadObjModel(url)
}
// load a resource
function loadObjModel({mtlUrl,objUrl,pngUrl,position}) {
  return new Promise((resolve,reject)=>{
    objLoader.load(
        // resource URL
        objUrl,
        // called when resource is loaded
        function ( object ) {
          console.log(object);
          console.log(object.children);
          if (pngUrl) {
            object.traverse(function(child) {
              if (child instanceof THREE.Mesh) {
                //设置模型皮肤
                // child.material.map = THREE.ImageUtils.loadTexture( '/pump.png');
                child.material.map = textureLoaderRes(pngUrl)
              }
            });
          }else{
            object.traverse(function(child) {
              if (child instanceof THREE.Mesh) {
                //设置模型皮肤
                // child.material.map = THREE.ImageUtils.loadTexture( '/pump.png');
                // child.material.color = 'red'
              }
            });
          }
          object.position.set(position.x, position.y, position.z);
          scene.add(object);
          resolve(object)
        },
        // called when loading is in progresses
        function ( xhr ) {
          console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        // called when loading has errors
        function ( error ) {
          console.log( 'An error happened' );
          reject()
        }
    );
  })
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
  scene.add(pumpMesh)
  scene.add(hostMesh)
  scene.add(pumpFanMesh)
}
// 导入主机
function importHost() {
  return new Promise((resolve)=>{
    const host = curScene.value.host
    resolve(loadMtl(host))
  })
}
// 导入水泵
function importPump() {
  return new Promise((resolve)=>{
    const pump = curScene.value.pump
    resolve(loadMtl(pump))
  })
}
// 导入风扇
function importPumpFan() {
  return new Promise((resolve)=>{
    const pumpFan = curScene.value.pumpFan
    resolve(loadObjModel(pumpFan))
  })
}

// 加载材质后加载模型
function loadMtl({mtlUrl,objUrl,pngUrl,position}) {
  return new Promise(resolve => {
    mtlLoader.load(mtlUrl, function (material) {
      let objLoader = new OBJLoader();
      //设置当前加载的纹理
      objLoader.setMaterials(material);
      // objLoader.setPath('/lib/assets/models/');
      objLoader.load(objUrl, function (object) {

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
        // //将模型缩放并添加到场景当中
        // object.scale.set(100, 100, 100);
        object.traverse(function(child) {
          if (child instanceof THREE.Mesh) {
            //设置模型皮肤
            child.material.map = textureLoaderRes(pngUrl)
          }
        });
        object.position.set(position.x, position.y, position.z); // x,y,z
        resolve(object)
      },function ( xhr ) {
        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
      },)
    });
  })
}
// 循环渲染
const render = () => {
  requestAnimationFrame(render);
  renderer.clear(); // 清除画布
  labelRenderer.render( scene, camera );
  controls.update(); // 轨道控制器的更新
  renderer.clear(); // 清除画布
  renderer.render(scene, camera);
  if (pumpFanMesh) {
    pumpFanMesh.rotateX(0.1);
  }
};


// 键盘移动事件
function keyPressed(e) {
  var key = e.keyCode;
  if (!boxHelper) {
    // document.getElementById('notice').innerHTML = '请先选中物体' + key.toString()
  }
  switch (key) {
    case 37: // 左
      selectedObject.translateX(-0.5);
      break;
    case 39: // 右
      selectedObject.position.x += 0.5;
      break;
    case 38: // 上
      selectedObject.position.z -= 0.5;
      break;
    case 40: // 下
      selectedObject.position.z += 0.5;
      break;
  }
}
// 鼠标点击事件
function mouseDownFuc(e){
  // e.preventDefault()
  let raycaster = new THREE.Raycaster();//创建光线投射对象
  let mouse = new THREE.Vector2();//创建二维平面
  let intersectsObjArr = getSelsectOBj(mouse,raycaster, e);//通过封装的getSelsectOBj函数获取鼠标选中对象集合，e是点击事件对象
  console.log(intersectsObjArr);
  if (intersectsObjArr.length > 0) {
    let objectMesh = intersectsObjArr.find(element => element.object.type === 'Mesh');
    if (objectMesh) {
      if (boxHelper) {
        scene.remove(boxHelper)
      }
      // objectMesh.object.translateX(11);
      boxHelper = new THREE.BoxHelper(objectMesh.object,0xffff00);
      scene.add(boxHelper)
      selectedObject = objectMesh.object
    }else{
      boxHelper && scene.remove(boxHelper)
    }
  }else{
    boxHelper && scene.remove(boxHelper)
  }
}
//获取事件操作对象
function getSelsectOBj(mouse,raycaster, e) {
  //将html坐标系转化为webgl坐标系，并确定鼠标点击位置
  mouse.x =  e.clientX / renderer.domElement.clientWidth*2-1;
  mouse.y =  -(e.clientY / renderer.domElement.clientHeight*2)+1;
  raycaster.setFromCamera(mouse,camera);//以camera为z坐标，确定所点击物体的3D空间位置
  let intersects = raycaster.intersectObjects(scene.children, true);//确定所点击位置上的物体数量集合
  return intersects;//返回连线经过的物体集合
}

onMounted(() => {
  init();
  window.addEventListener('mouseup', mouseDownFuc,false);
  window.addEventListener('keydown', keyPressed,false);
  // onresize 事件会在窗口被调整大小时发生
  window.onresize=function(){
    // 重置渲染器输出画布canvas尺寸
    renderer.setSize(window.innerWidth,window.innerHeight);
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
</script>

