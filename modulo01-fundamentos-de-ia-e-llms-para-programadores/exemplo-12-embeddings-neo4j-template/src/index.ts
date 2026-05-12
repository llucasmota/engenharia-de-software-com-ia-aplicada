import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { CONFIG } from "./config.ts";
import { DocumentProcessors } from "./documentProcessors.ts";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { type PretrainedOptions } from "@huggingface/transformers";
import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
import { displayResults } from "./util.ts";

let _neo4jVectorStore = null;


async function clearAll(vectorStore: Neo4jVectorStore, nodeLabel: string): Promise<void> {
  console.log("🗑️Removendo todos os vetores")
  await vectorStore.query(`MATCH (n:\`${nodeLabel}\`) DETACH DELETE n`)
  console.log("✅ Documentos removidos com sucesso\n")
}

try {
  const documentProcessors = new DocumentProcessors(CONFIG.pdf.path, CONFIG.textSplitter,)

  const documents = await documentProcessors.loadAndSplit();

  const embeddings = new HuggingFaceTransformersEmbeddings({
    model: CONFIG.embedding.modelName,
    pretrainedOptions: CONFIG.embedding.pretrainedOptions as PretrainedOptions
  })

  // const response = await embeddings.embedQuery("Javascript")
  // console.log(`Response: ${response}`)

  _neo4jVectorStore = await Neo4jVectorStore.fromExistingGraph(embeddings,
    CONFIG.neo4j);



  for (const [index, doc] of documents.entries()) {
    console.log(`✅ Adicionando documento ${index + 1}/${documents.length}`)

    await _neo4jVectorStore.addDocuments([doc])
  }
  console.log(`✅ Base de dados populada com sucesso`)


  console.log(`🔎 Buscando similaridade `);
  const questions = [
    "O que significa treinar uma rede neural?"
  ]

  for (const question of questions) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📌 PERGUNTA: ${question}`)
    console.log('='.repeat(80))

    const results = await _neo4jVectorStore.similaritySearch(question, CONFIG.similarity.topK)

    displayResults(results);
  }

  await clearAll(_neo4jVectorStore, CONFIG.neo4j.nodeLabel);

} catch (error) {
  console.error(error)

} finally {
  await _neo4jVectorStore?.close()
}