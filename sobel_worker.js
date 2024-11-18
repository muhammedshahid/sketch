importScripts('sobel.js', 'indexedDB.js')

const db = new IndexedDB()

const dbp = db.open()


self.onconnect = (event) => {
  console.log(`conn`)
  const port = event.ports[0];

  port.onmessage = async function (event) {
    let msg = event.data;
    console.log(msg);
    
    switch (msg.cmd) {
      case 'save':
        //let returnMsg = { callback: {fn:'saved', bind:[] } }
        db.get('processing',[msg.callback.bind[0]]).then(e=>{
          if(e.status && e.data.length){
            let data = e.data[0]
            data.current += 1
            data.version.push(msg.param[0].data.buffer)

            db.put('processing', [data]).then(e=>{
              if(!e.status)
              return port.postMessage({ callback: msg.callback, param: [false] })
              port.postMessage({ callback: msg.callback, param: [true] })
              msg.callback.fn = 'updateVersion'
              port.postMessage({ callback: msg.callback, param: [data.version.length, data.current] })
            })
          }

        })
        break

      case 'sobelEdgeDetection':
        let sketch = sobelEdgeDetection(...msg.param)
        //let sketch = sobelEdgeDetection2(...msg.param)
        port.postMessage({ callback: msg.callback, param: [sketch] })
        store(msg.callback.bind, sketch)
        break;

      case 'adjustBrightnessAndContrast':
        db.get('processing', [msg.callback.bind[0]]).then(e=>{
          if(e.status && e.data.length){
            let data = e.data[0]
            data = new ImageData(new Uint8ClampedArray(data.sketch), data.dimensions[0], data.dimensions[1])
            let newImageData = adjustBrightnessAndContrast2(data, ...msg.param)
            port.postMessage({ callback: msg.callback, param: [newImageData] })
          }
        })
        break;

      case 'getVersion' :
        db.get('processing', [msg.callback.bind[0]]).then(e=>{
          if(e.status && e.data.length){
            let data = e.data[0]
            if(data.version[msg.param[0]]){
              let i = new ImageData(new Uint8ClampedArray(data.version[msg.param[0]]), data.dimensions[0], data.dimensions[1])
              port.postMessage({ callback: msg.callback, param: [i] })
            }else{
              let i = new ImageData(new Uint8ClampedArray(data.sketch), data.dimensions[0], data.dimensions[1])
              port.postMessage({ callback: msg.callback, param: [i] })
            }
          }
        })
        break;

    }
  };

  port.onerror = function (error) {
    console.error('Error in shared worker:', error);
  };
  port.start()
  dbp.then(e=>{
    e.getAll('processing').then(e=>{
      if(e.status){
        for(let data of e.data){
          let msg = {callback:{fn:'prepareImg', bind:data.id}}
          let buffer = data.current<0?data.sketch:data.version[data.current] || data.sketch
          port.postMessage({ callback: msg.callback, param: [buffer, data.dimensions] })
          if(data.version.length){
            msg.callback.fn = 'updateVersion'
            port.postMessage({ callback: msg.callback, param: [data.version.length, data.current] })
          }
          
        }
      }
    })
  })
  
};

async function store(id, imageData){
  let buffer = imageData.data.buffer
  db.add('processing', [{id:id, sketch:buffer, dimensions:[imageData.width, imageData.height], current:-1, version:[]}])
}



function convertToBlob(imageData) {
  let uint8Array = new Uint8Array(imageData.data);
  let blob = new Blob([uint8Array], { type: 'image/png' });
  return URL.createObjectURL(blob);
}

function convertToImageData(data, width, height) {
  return new ImageData(data, width, height)
}

function sobelEdgeDetection(imageData, sigma) {
  const grayImageData = grayscale(imageData)
  //const histogramEq = histogramEqualization(imageData)
  const blurredImageData = gaussianBlur(grayImageData, sigma)
  const edges = sobelOperator(blurredImageData)
  return new ImageData(invert(edges), imageData.width, imageData.height)
}

function sobelEdgeDetection2(imageData, sigma) {
  const hsvImageData = rgbToHsv(imageData)
  const blurredImageData = gaussianBlur(hsvImageData, sigma)
  const edges = sobelOperator(blurredImageData)
  return new ImageData(invert(edges), imageData.width, imageData.height)
}