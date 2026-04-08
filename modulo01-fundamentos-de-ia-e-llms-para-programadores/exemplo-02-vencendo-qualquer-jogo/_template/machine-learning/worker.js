importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest');

const MODEL_PATH = `yolov5n_web_model/model.json`;
const LABELS_PATH = `yolov5n_web_model/labels.json`;

const INPUT_MODEL_DIMENTIONS = 640;

const CLASS_THRESHOLD = 0.4


let _model = null;
let _labels = [];

async function loadModelAndLabels() {
    await tf.ready()

    _labels = await fetch(LABELS_PATH).then(res => res.json());
    _model = await tf.loadGraphModel(MODEL_PATH);

    // warmup model
    const dummyInput = tf.ones(_model.inputs[0].shape)
    await _model.executeAsync(dummyInput)
    tf.dispose(dummyInput)

    postMessage({ type: 'model-loaded' })
}



// Pré processamento da imagem para o formato aceito pelo YOLO
// - tf.browser.fromPixels(): converteImageBitMap/ImageData para tensor [H, W, 3]
// - tf.image.resizeBilinear(): redimensiona a imagem para o tamanho esperado pelo modelo
// - tf.expandDims(): adiciona uma dimensão ao tensor
// - tf.div(): divide o tensor por 255 -> tranforma tudo pra 0/1
// - tf.sub(): subtrai o valor médio do tensor
// - tf.mul(): normaliza tudo para 0, 1
// - tf.transpose(): transpoe o tensor
// - tf.cast(): converte o tensor para o tipo float32
// - tf.tidy(): libera a memória do tensor

function preprocessImage(input) {
    return tf.tidy(() => {
        const image = tf.browser.fromPixels(input)


        const result = tf.image.resizeBilinear(image, [INPUT_MODEL_DIMENTIONS, INPUT_MODEL_DIMENTIONS])
            .div(255) // transforma tudo pra 0/1
            .expandDims(0)
        return result

    })
}


async function runInference(tensor) {
    const output = await _model.executeAsync(tensor)
    tf.dispose(tensor)

    //Assume que as 3 primeiras saídas são:
    // boxes, scores e classes
    const [boxes, scores, classes] = output.slice(0, 3)

    const [boxesData, scoresData, classesData] = await Promise.all([
        boxes.data(),
        scores.data(),
        classes.data(),
    ])

    output.forEach(t => t.dispose())

    return {
        boxes: boxesData,
        scores: scoresData,
        classes: classesData
    }



}

function* processPrediction({ boxes, scores, classes }, width, height) {
    for (let index = 0; index < scores.length; index++) {
        if (scores[index] < CLASS_THRESHOLD) continue
        const label = _labels[classes[index]]
        if (label !== 'kite') continue

        /// Se index = 0 (primeira detecção):

        // Início: 0 * 4 = 0
        // Fim(exclusivo): (0 + 1) * 4 = 4
        // slice(0, 4) pega os itens[0, 1, 2, 3].
        let [x1, y1, x2, y2] = boxes.slice(index * 4, (index + 1) * 4)
        x1 *= width
        y1 *= height
        x2 *= width
        y2 *= height
        const boxWidth = x1 - x2;
        const boxHeight = y1 - y2;
        const centerX = x1 + boxWidth / 2;
        const centerY = y1 + boxHeight / 2;

        yield {
            x: centerX,
            y: centerY,
            score: (scores[index] * 100).toFixed(2)

        }
        // debugger
    }
}

loadModelAndLabels()


self.onmessage = async ({ data }) => {
    if (data.type !== 'predict') return
    if (!_model) return

    const input = preprocessImage(data.image)
    const { width, height } = data.image
    const inferenceResults = await runInference(input)

    for (const prediction of processPrediction(inferenceResults, width, height)) {
        console.log(prediction)
        postMessage({
            type: 'prediction',
            ...prediction
        });
    }





};

console.log('🧠 YOLOv5n Web Worker initialized');
