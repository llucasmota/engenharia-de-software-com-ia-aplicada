import tf from '@tensorflow/tfjs-node'


async function trainModel(inputXs, outputYs) {

    const model = tf.sequential()

    // Primeira camada da rede:
    // entrada de 7 posições (idade normalizada + 3 cores + 3 localizacoes)

    // 80 neuronios = aqui coloquei tudo isso, pq tem pouca base de treino
    // quanto mais neuronios, mais complexidade a rede pode aprender
    // e consequentemente, mais processamento ela vai usar

    // A ReLU age como um filtro:
    // É como se ela deixasse somente os dados interessantes seguirem viagem na rede
    // Se a informação chegou nesse neuronio é positiva, passa para frente!
    // se for zero ou negativa, pode jogar fora, nao vai servir para nada
    model.add(tf.layers.dense({inputShape: [7], units: 80, activation: 'relu' }))

    // Saída: 3 neurônios, pois são 3 categorias
    // um para cada categoria(premium, medium, basic)
    model.add(tf.layers.dense({units: 3, activation: 'softmax' }))

    // Compilação do modelo
    // optimizer: Adam (Adaptative Moment Estimation)
   // é um treinador pessoal moderno para redes neurais
   // ele ajusta os pesos da rede para minimizar o erro
   //aprender com o histórico de erros e acertos

    // loss: categoricalCrossentropy
    // Ele compara o que o model "acha"(os scores de cada categoria)
    // com o que é verdade (o label)
    //Exemplo clárissco: classificação de imagens, recomendação, categorização de usuário

    // qualquer coisa que a resposta é uma entre várias
    model.compile({
        optimizer: 'adam', 
        loss: 'categoricalCrossentropy', 
        metrics: ['accuracy']
    })

    // treinamento do modelo
    // epochs: quantas vezes o modelo vai ver os dados
    //shuffle: embaralhar os dados

    await model.fit(
        inputXs,
        outputYs,
       {
        verbose: 0,
        epochs: 100,
        shuffle: true,
        // callbacks: {
        //     onEpochEnd: (epoch, logs) => console.log(`Epoch: ${epoch}, Loss: ${logs.loss}`)
        //     }
        }        
    )  
    return model  
}


async function predict(model, pessoa) {
  // transform a js array to a tensor 
  const tfInput = tf.tensor2d(pessoa)
  const prediction = model.predict(tfInput)
  const arrayPredict = await prediction.array()
  return arrayPredict[0].map((prob, index) => ({ prob, index }))

}

// Exemplo de pessoas para treino (cada pessoa com idade, cor e localização)
// const pessoas = [
//     { nome: "Erick", idade: 30, cor: "azul", localizacao: "São Paulo" },
//     { nome: "Ana", idade: 25, cor: "vermelho", localizacao: "Rio" },
//     { nome: "Carlos", idade: 40, cor: "verde", localizacao: "Curitiba" }
// ];

// Vetores de entrada com valores já normalizados e one-hot encoded
// Ordem: [idade_normalizada, azul, vermelho, verde, São Paulo, Rio, Curitiba]
// const tensorPessoas = [
//     [0.33, 1, 0, 0, 1, 0, 0], // Erick
//     [0, 0, 1, 0, 0, 1, 0],    // Ana
//     [1, 0, 0, 1, 0, 0, 1]     // Carlos
// ]


// Usamos apenas os dados numéricos, como a rede neural só entende números.
// tensorPessoasNormalizado corresponde ao dataset de entrada do modelo.
const tensorPessoasNormalizado = [
    [0.33, 1, 0, 0, 1, 0, 0], // Erick
    [0, 0, 1, 0, 0, 1, 0],    // Ana
    [1, 0, 0, 1, 0, 0, 1]     // Carlos
]

// Labels das categorias a serem previstas (one-hot encoded)
// [premium, medium, basic]
const labelsNomes = ["premium", "medium", "basic"]; // Ordem dos labels
const tensorLabels = [
    [1, 0, 0], // premium - Erick
    [0, 1, 0], // medium - Ana
    [0, 0, 1]  // basic - Carlos
];


// Criamos tensores de entrada (xs) e saída (ys) para treinar o modelo
const inputXs = tf.tensor2d(tensorPessoasNormalizado)
const outputYs = tf.tensor2d(tensorLabels)


const model = await trainModel(inputXs, outputYs)


const zePerson = { nome: "Zé", idade: 28, cor: "verde", localizacao: "Curitiba" }

// idade normalizada: (idade - idade_min) / (idade_max - idade_min)
// idade_min = 25, idade_max = 40, então (28 - 25) / (40 - 25 ) = 0.2

const zePersonNormalizado = [
    [
        0.2, // idade normalizada
        0,   // azul
        0,   // vermelho
        1,   // verde
        0,   // São Paulo
        0,   // Rio
        1    // Curitiba
    ]
]

const predictionResult = await predict(model, zePersonNormalizado)
const result = predictionResult.sort((a, b) => b.prob - a.prob).map(p => `${labelsNomes[p.index]} (${(p.prob * 100).toFixed(2)}%)`).join('\n')

console.log(result)
