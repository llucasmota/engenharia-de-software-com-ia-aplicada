import "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js";
import { workerEvents } from "../events/constants.js";

console.log("Model training worker initialized");
let _globalCtx = {};
let _model = null;


const WEIGHTS = {
  category: 0.4,
  color: 0.3,
  price: 0.2,
  age: 0.1
}

// "id": 1,
//     "name": "Fones de Ouvido Sem Fio",
//         "category": "eletrônicos",
//             "price": 129.99,
//                 "color": "preto"

// Normalize continuous values to [0, 1]
const normalize = (value, min, max) => (value - min) / (max - min) || 1;
function makeContext(products, users) {
  const ages = users.map((u) => u.age);
  const prices = products.map((p) => p.price);

  const minAge = Math.min(...ages);

  const maxAge = Math.max(...ages);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const colors = [...new Set(products.map((p) => p.color))];
  const categories = [...new Set(products.map((p) => p.category))];

  const colorsIndex = Object.fromEntries(colors.map((color, index) => [color, index]));

  const categoriesIndex = Object.fromEntries(
    categories.map((category, index) => [category, index]),
  );

  const midAge = (minAge + maxAge) / 2;
  const ageSums = {};
  const ageCounts = {};

  users.forEach((user) => {
    user.purchases.forEach((p) => {
      ageSums[p.name] = (ageSums[p.name] || 0) + user.age;
    });
  });

  const productAvgAgeNorm = Object.fromEntries(
    products.map((product) => {
      const avg = ageCounts[product.name]
        ? ageSums[product.name / ageCounts[product.name]]
        : minAge;
      return [product.name, normalize(avg, minAge, maxAge)];
    }),
  );

  return {
    products,
    users,
    colorsIndex,
    categoriesIndex,
    minAge,
    maxAge,
    minPrice,
    maxPrice,
    midAge,
    numCategories: categories.length,
    numColors: colors.length,
    productAvgAgeNorm,
    //price + age 
    dimentions: 2 + categories.length + colors.length
  };
}

const oneHotWeighted = (index, lenght, weight) => tf.oneHot(index, lenght).cast('float32').mul(weight)


function encodeProduct(product, context) {

  // normalizando os dados e aplicando o peso na recomendação
  const price = tf.tensor1d([normalize(product.price, context.minPrice, context.maxPrice) * WEIGHTS.price])


  const age = tf.tensor1d([(context.productAvgAgeNorm[product.name] ?? 0.5) * WEIGHTS.age])

  const category = oneHotWeighted(context.categoriesIndex[product.category], context.numCategories, WEIGHTS.category)


  const color = oneHotWeighted(context.colorsIndex[product.color], context.numColors, WEIGHTS.color)

  return tf.concat1d([price, age, category, color])


}

function encodeUser(user, context) {
  // tamanho daa lista de compras
  if (user.purchases.length) {
    return tf.stack(
      user.purchases.map(
        product => encodeProduct(product, context)
      )
    )
      .mean(0)
      .reshape([
        1, context.dimentions
      ])
  }

  return tf.concat1d(
    [
      tf.zeros([1]),
      tf.tensor1d([
        normalize(user.age, context.minAge, context.maxAge) * WEIGHTS.age
      ]),
      tf.zeros([context.numCategories]), // categoria ignorada
      tf.zeros([context.numColors]) // igorado
    ]
  ).reshape([1, context.dimentions])
}

function createTrainingData(context) {
  const inputs = []
  const labels = []
  context.users
    .filter(u => u.purchases.length)
    .forEach(user => {
      const userVector = encodeUser(user, context).
        dataSync()

      context.products.forEach(product => {
        const productVector = encodeProduct(product, context).dataSync()

        const label = user.purchases.some(purchase => purchase.name == product.name ? 1 : 0)
        inputs.push([...userVector, ...productVector])
        labels.push(label)
      })
    })
  return {
    xs: tf.tensor2d(inputs),
    ys: tf.tensor2d(labels, [labels.length, 1]),
    inputDimention: context.dimentions * 2

  }

}
//treinar o modelo

async function configureNeuralNetAndTrain(trainData) {

  // inputShape: número de features por exemplo de treino(trainData.inputDim)
  // Exemplo: se o vetor produto + usuário = 20 números, então inputDim = 20
  // units: neurônios
  // activation: 'relu' (mantém apenas sinais positivos, ajuda a aprender padrões não-lineares)
  const model = tf.sequential()
  model.add(
    tf.layers.dense({
      inputShape: [trainData.inputDimention], // pra saber o nome do vetor
      units: 128, // qtd neurônios
      activation: 'relu',

    }))

  model.add(tf.layers.dense({
    units: 64,
    activation: 'relu',
  }))

  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu',
  }))

  //1 neurônio porque vamos retornar apenas uma pontuação de recomendação

  // activation: 'sigmoid' (transforma o valor em uma probabilidade entre 0 e 1)

  //Exemplo: 0.9 = alta recomendação, 0.1 baixa

  model.add(tf.layers.dense({
    units: 1,
    activation: 'sigmoid',
  }))

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  })



  await model.fit(trainData.xs, trainData.ys, {
    epochs: 100, // quantidade de vezes que o modelo vai rodar na base
    batchSize: 32,
    shuffle: true, // embaralhar os dados
    callbacks: {
      onEpochEnd: (epoch, logs) => {

        postMessage({
          type: workerEvents.trainingLog,
          epoch: epoch,
          loss: logs.loss,
          accuracy: logs.acc,
        });
        // console.log(`Epoch ${epoch}: loss = ${logs.loss}, accuracy = ${logs.accuracy}`);
      }
    }
  })

  return model;
  // debugger
}


async function trainModel({ users }) {
  const products = await (await fetch("/data/products.json")).json();

  const context = makeContext(products, users);

  context.productVectors = context.products.map(product => {
    return {
      name: product.name,
      metaData: { ...product },
      vector: encodeProduct(product, context).dataSync()
    }

  })

  _globalCtx = context;

  const trainData = createTrainingData(context)

  _model = await configureNeuralNetAndTrain(trainData)



  postMessage({
    type: workerEvents.progressUpdate,
    progress: { progress: 100 },
  });

  postMessage({ type: workerEvents.trainingComplete });






}
function recommend({ user }) {


  if (!_model) return;

  const context = _globalCtx;
  // converta o usuário fornecido no vetor de features codificadas
  // (preço ignorado, idade nornalizada, categorias ignoradas)
  // Isso transforma as informações do usuário no mesmo formato numérico que foi usado para treinar o modelo
  const userVector = encodeUser(user, _globalCtx).dataSync()
  // Crie pares de entrada para: cada produto, concatene com o vetor do usuário
  // com o vetor codificado do produto.
  // Por quê? O modelo prevê o "score de compatibilidade" para cada par(usuário, produto)

  const inputs = context.productVectors.map(({ vector }) => {
    return [...userVector, ...vector]
  })

  const inputTensor = tf.tensor2d(inputs)
  const predictions = _model.predict(inputTensor)

  const scores = predictions.dataSync()
  const recommendations = context.productVectors.map((item, index) => {
    return {
      ...item.meta,
      name: item.name,
      score: scores[index] // previsão do modelo par ao produto
    }
  })

  const sortdItems = recommendations
    .sort((a, b) => b.score - a.score)

  console.log("will recommend for user:", user);
  postMessage({
    type: workerEvents.recommend,
    user,
    recommendations: sortdItems.slice(0, 10)
  });
}

const handlers = {
  [workerEvents.trainModel]: trainModel,
  [workerEvents.recommend]: (d) => recommend({ user: d.user }),
};

self.onmessage = (e) => {
  const { action, ...data } = e.data;
  if (handlers[action]) handlers[action](data);
};
