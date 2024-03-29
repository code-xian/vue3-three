export default {
    scene1:{
        pump:[{
            name:'水泵1',
            group: 1,
            objUrl:'/pump.obj',
            mtlUrl:'/pump.mtl',
            pngUrl:'/pump.png',
            position:{
                x:110,
                y:0,
                z:10
            }
        },
        {
            name:'水泵2',
            group: 2,
            objUrl:'/pump.obj',
            mtlUrl:'/pump.mtl',
            pngUrl:'/pump.png',
            position:{
                x:110,
                y:0,
                z:-90
            }
        }],
        host:[{
            name:'主机1',
            group: 1,
            objUrl: new URL(`../assets/host.obj`, import.meta.url).href,
            mtlUrl:'/host.mtl',
            pngUrl:'/host.png',
            position:{
                x:-20,
                y:0,
                z:10
            }
        }
        ,{
            name:'主机2',
            group: 2,
            objUrl:new URL(`../assets/host.obj`, import.meta.url).href,
            mtlUrl:'/host.mtl',
            pngUrl:'/host.png',
            position:{
                x:-20,
                y:0,
                z:-90
            }
        }
        ],
        pumpFan:[
          {
            group: 1,
            name:'水泵风扇1',
            objUrl:'/pump-fan.obj',
            // mtlUrl:'/pump.mtl',
            position:{
                x:123,
                y:20,
                z:10
            }
        },
        {
            group: 2,
            name:'水泵风扇2',
            objUrl:'/pump-fan.obj',
            // mtlUrl:'/pump.mtl',
            position:{
                x:123,
                y:20,
                z:-90
            }
        }]
    }
}
